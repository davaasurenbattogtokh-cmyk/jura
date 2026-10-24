import {DatabaseSync} from 'node:sqlite';
import {pbkdf2Sync, randomBytes, randomUUID} from 'node:crypto';
import {chmodSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

// Passwords arrive only through stdin, never arguments, environment, or output.
process.umask(0o077);
let password = '';
try {
  for await (const chunk of process.stdin) {
    password += chunk.toString('utf8');
    if (Buffer.byteLength(password, 'utf8') > 4096) throw new Error('Password is too long.');
  }
  if (password.length < 10 || /[\r\n\x00-\x1f\x7f]/.test(password)) {
    throw new Error('Use at least 10 characters without control characters. No changes made.');
  }
  const path = join(resolve(process.env.DATA_DIR || 'data'), 'jura.sqlite');
  if (!existsSync(path)) throw new Error('Database not found. No changes made.');
  const db = new DatabaseSync(path);
  try {
    db.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    const backupPath = path + '.before-admin-reset-' + randomUUID();
    db.prepare('VACUUM INTO ?').run(backupPath);
    chmodSync(backupPath, 0o600);
    const salt = randomBytes(24).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    password = '';
    db.exec('BEGIN IMMEDIATE');
    try {
      const matches = db.prepare("SELECT id,username,role FROM users WHERE id='initial-admin' OR lower(username)='juradmin'").all();
      if (matches.length !== 1 || matches[0].role !== 'admin' || matches[0].username.toLowerCase() !== 'juradmin') {
        throw new Error('Expected one existing Juradmin administrator. No changes made.');
      }
      const admin = matches[0];
      db.prepare("UPDATE users SET password_hash=?,salt=?,status='active' WHERE id=?").run(hash, salt, admin.id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(admin.id);
      db.prepare('INSERT INTO audit_logs(id,user_id,action,target,detail,created_at) VALUES(?,?,?,?,?,?)').run(
        randomUUID(), admin.id, 'admin_password_recovery', admin.id, 'Local server terminal recovery', new Date().toISOString()
      );
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    console.log('Juradmin password reset successfully. Previous administrator sessions revoked.');
    console.log('Database backup saved at: ' + backupPath);
    console.log('Open https://juras.consulting/login and use the new password.');
    console.log('If too many attempts were made, wait 15 minutes before retrying.');
  } finally {
    db.close();
  }
} catch (error) {
  password = '';
  console.error(error.message);
  process.exitCode = 1;
}
