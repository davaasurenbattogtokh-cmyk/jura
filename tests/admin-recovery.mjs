import assert from 'node:assert/strict';
import {mkdtempSync, readdirSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const script = resolve('scripts/reset-admin.mjs');
const password = randomBytes(24).toString('hex');
const root = mkdtempSync(join(tmpdir(), 'jura-admin-recovery-'));
function fixture() {
  const dir = mkdtempSync(join(root, 'case-'));
  const db = new DatabaseSync(join(dir, 'jura.sqlite'));
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,password_hash TEXT,salt TEXT,status TEXT);
    CREATE TABLE sessions(id TEXT,user_id TEXT);
    CREATE TABLE audit_logs(id TEXT,user_id TEXT,action TEXT,target TEXT,detail TEXT,created_at TEXT);
    CREATE TABLE tasks(id TEXT,title TEXT);
    INSERT INTO users VALUES('initial-admin','Juradmin','admin','old-hash','old-salt','active'),('other','staff','work','other-hash','other-salt','active');
    INSERT INTO sessions VALUES('admin-session','initial-admin'),('staff-session','other');
    INSERT INTO tasks VALUES('task','Preserve existing data');`);
  return {dir, db};
}
function recover(dir, input=password) {
  return spawnSync(process.execPath, [script], {input, encoding:'utf8', env:{...process.env, DATA_DIR:dir}});
}
try {
  const a = fixture();
  const result = recover(a.dir);
  assert.equal(result.status, 0, result.stderr);
  assert(!result.stdout.includes(password));
  const admin = a.db.prepare("SELECT * FROM users WHERE id='initial-admin'").get();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(admin.salt),iterations:100000,hash:'SHA-256'},key,256)).toString('hex');
  assert.equal(admin.password_hash, hash, 'New credential must match the application verifier');
  assert.equal(a.db.prepare('SELECT count(*) AS n FROM sessions WHERE user_id=?').get('initial-admin').n, 0);
  assert.equal(a.db.prepare('SELECT count(*) AS n FROM sessions WHERE user_id=?').get('other').n, 1);
  assert.equal(a.db.prepare('SELECT password_hash FROM users WHERE id=?').get('other').password_hash,'other-hash');
  assert.equal(a.db.prepare('SELECT title FROM tasks').get().title,'Preserve existing data');
  assert.equal(a.db.prepare('SELECT action FROM audit_logs').get().action,'admin_password_recovery');
  const backupName = readdirSync(a.dir).find(x=>x.includes('.before-admin-reset-'));
  assert.equal(statSync(join(a.dir,backupName)).mode & 0o777,0o600);
  const backup = new DatabaseSync(join(a.dir,backupName));
  assert.equal(backup.prepare("SELECT password_hash FROM users WHERE id='initial-admin'").get().password_hash,'old-hash');
  backup.close(); a.db.close();
  const b = fixture();
  assert.notEqual(recover(b.dir,'short').status,0);
  assert.equal(b.db.prepare("SELECT password_hash FROM users WHERE id='initial-admin'").get().password_hash,'old-hash');
  b.db.exec("UPDATE users SET role='work' WHERE id='initial-admin'");
  assert.notEqual(recover(b.dir).status,0);
  assert.equal(b.db.prepare("SELECT password_hash FROM users WHERE id='initial-admin'").get().password_hash,'old-hash');
  b.db.exec("UPDATE users SET role='admin' WHERE id='initial-admin'; DROP TABLE audit_logs;");
  assert.notEqual(recover(b.dir).status,0);
  assert.equal(b.db.prepare("SELECT password_hash FROM users WHERE id='initial-admin'").get().password_hash,'old-hash','Rollback must preserve credentials when audit write fails');
  assert.equal(b.db.prepare('SELECT count(*) AS n FROM sessions').get().n,2);
  b.db.close();
  console.log('Admin recovery checks passed: credential compatibility, backup, data/session isolation, validation and rollback.');
} finally {
  rmSync(root,{recursive:true,force:true});
}
