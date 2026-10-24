import {env} from './env';
export const db=()=>{if(!env.DB)throw new Error('Өгөгдлийн сан холбогдоогүй.');return env.DB};
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ulaanbaatar',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const one=async(sql:string,...args:any[])=>db().prepare(sql).bind(...args).first<any>();
export const all=async(sql:string,...args:any[])=>(await db().prepare(sql).bind(...args).all<any>()).results;
export const run=async(sql:string,...args:any[])=>db().prepare(sql).bind(...args).run();
export const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a)).map(v=>v.toString(16).padStart(2,'0')).join('');
export async function hash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
export const tokenHash=async(v:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
export function equal(a:string,b:string){let n=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)n|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return n===0}
export const safeUser=(u:any)=>{if(!u)return null;const {password_hash,salt,...s}=u;return s};
export async function bootstrap(){if(!env.ADMIN_PASSWORD_HASH||!env.ADMIN_PASSWORD_SALT)throw new Error('Анхны админы нэвтрэх тохиргоо дутуу байна.');await run("INSERT OR IGNORE INTO users(id,username,name,email,phone,role,password_hash,salt,status,created_at) VALUES('initial-admin','Juradmin','JURA Админ','','','admin',?,?,'active',?)",env.ADMIN_PASSWORD_HASH,env.ADMIN_PASSWORD_SALT,now());}
export async function auth(req:Request){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)jura_session=([^;]+)/)?.[1];if(!token)return null;return one('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND u.status=\'active\'',await tokenHash(token),Date.now());}
export function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status})}
export function requireRole(u:any,roles:string[]){if(!u)fail('Нэвтэрнэ үү.',401);if(!roles.includes(u.role))fail('Энэ үйлдлийг хийх эрхгүй.',403)}
export async function log(u:any,action:string,target:string,detail=''){await run('INSERT INTO audit_logs VALUES(?,?,?,?,?,?)',uid(),u?.id||'system',action,target,detail,now())}
export async function rate(key:string,limit:number,seconds:number){const id=await tokenHash(key);await run('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END',id,Date.now()+seconds*1000,Date.now(),Date.now());const r=await one('SELECT count FROM rate_limits WHERE id=?',id);if(r.count>limit)fail('Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.',429)}
