import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,writeFileSync,renameSync,statSync,unlinkSync,createReadStream} from 'node:fs';
import {join,resolve} from 'node:path';
import {Readable} from 'node:stream';
import {schemaSQL} from './schema-sql';
const dataPath=()=>resolve(process.env.DATA_DIR||'data');
let connection:DatabaseSync|undefined;
function sqlite(){
 if(connection)return connection;
 mkdirSync(dataPath(),{recursive:true,mode:0o700});
 const d=new DatabaseSync(join(dataPath(),'jura.sqlite'));
 d.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 d.exec('CREATE TABLE IF NOT EXISTS _jura_migrations (version TEXT PRIMARY KEY);');
 if(!d.prepare('SELECT version FROM _jura_migrations WHERE version=?').get('001')){
  d.exec('BEGIN IMMEDIATE');
  try{d.exec(schemaSQL);d.prepare('INSERT INTO _jura_migrations VALUES(?)').run('001');d.exec('COMMIT');}
  catch(e){d.exec('ROLLBACK');d.close();throw e;}
 }
 connection=d;return d;
}
class Statement {
 constructor(readonly sql:string,readonly values:any[]=[]){ }
 bind(...values:any[]){return new Statement(this.sql,values);}
 async first<T=any>():Promise<T|null>{return (sqlite().prepare(this.sql).get(...this.values) as T)||null;}
 async all<T=any>(){return {results:sqlite().prepare(this.sql).all(...this.values) as T[]};}
 async run(){const r=sqlite().prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
}
const DB={
 prepare:(sql:string)=>new Statement(sql),
 async batch(statements:Statement[]){const d=sqlite();d.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of statements){const r=d.prepare(s.sql).run(...s.values);results.push({success:true,meta:{changes:Number(r.changes)}});}d.exec('COMMIT');return results;}catch(e){d.exec('ROLLBACK');throw e;}},
};
function objectPath(id:string){if(!/^[a-f0-9-]{36}$/i.test(id))throw Object.assign(new Error('Файлын ID буруу.'),{status:400});const dir=join(dataPath(),'uploads');mkdirSync(dir,{recursive:true,mode:0o700});return join(dir,id);}
const BUCKET={
 async put(id:string,bytes:ArrayBuffer|Uint8Array,_options?:any){const dest=objectPath(id),temp=dest+'.'+crypto.randomUUID()+'.tmp';try{writeFileSync(temp,new Uint8Array(bytes as ArrayBuffer),{mode:0o600});renameSync(temp,dest);}finally{try{unlinkSync(temp);}catch{}}},
 async delete(id:string){try{unlinkSync(objectPath(id));}catch(e:any){if(e.code!=='ENOENT')throw e;}},
 async get(id:string,options?:{range?:Headers}){
  const path=objectPath(id);let size:number;try{size=statSync(path).size;}catch(e:any){if(e.code==='ENOENT')return null;throw e;}
  let start=0,end=size-1,range:undefined|{offset:number,length:number};
  const value=options?.range?.get('range');
  if(value){const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))throw Object.assign(new Error('Буруу byte range.'),{status:416});
   if(!m[1]){const suffix=Number(m[2]);if(suffix<=0)throw Object.assign(new Error('Буруу byte range.'),{status:416});start=Math.max(0,size-suffix);}
   else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}
   if(start>=size||end<start)throw Object.assign(new Error('Byte range хэтэрсэн.'),{status:416});range={offset:start,length:end-start+1};
  }
  return {size,range,body:Readable.toWeb(createReadStream(path,{start,end})) as ReadableStream<Uint8Array>};
 }
};
export const env={
 DB,BUCKET,
 get APP_URL(){return (process.env.APP_URL||'https://jura.consulting').replace(/\/$/,'');},
 get ADMIN_PASSWORD_HASH(){return process.env.ADMIN_PASSWORD_HASH;},
 get ADMIN_PASSWORD_SALT(){return process.env.ADMIN_PASSWORD_SALT;},
 get RESEND_API_KEY(){return process.env.RESEND_API_KEY;},
 get EMAIL_FROM(){return process.env.EMAIL_FROM;},
 get MAINTENANCE_TOKEN(){return process.env.MAINTENANCE_TOKEN;},
};
export function closeDatabase(){connection?.close();connection=undefined;}
