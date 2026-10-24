import {env} from './env';
import {all,one,run,day,now} from './auth';
import {resolveSettings} from './content';
export async function runDailyJobs(){
 const row=await one("SELECT value FROM settings WHERE id='general'");const settings=resolveSettings(row?JSON.parse(row.value):{});
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ulaanbaatar',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());let queued=0,sent=0;
 if(time>=settings.reminderTime){
  const users=await all("SELECT * FROM users WHERE status='active'");for(const user of users){
   const tasks=(await all('SELECT * FROM tasks WHERE user_id=? AND active=1',user.id)).filter(t=>day()>=t.date&&(t.recurrence==='daily'||t.date===day()||t.recurrence==='weekly'&&new Date(day()).getDay()===new Date(t.date).getDay()));
   const complete=await all('SELECT task_id FROM completions WHERE user_id=? AND date=?',user.id,day());const pending=tasks.filter(t=>!complete.some(c=>c.task_id===t.id));if(!pending.length)continue;
   let email=user.email;if(user.role==='kids'){const parent=user.parent_id&&user.consent_at?await one("SELECT email FROM users WHERE id=? AND status='active'",user.parent_id):null;email=parent?.email||''}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))continue;
   const r=await run("INSERT OR IGNORE INTO email_outbox(id,recipient,subject,body,status,error,attempts,created_at) VALUES(?,?,?,?,'queued','',0,?)",`digest:${user.id}:${day()}`,email,'JURA · Өнөөдрийн дадал, даалгавар',`${day()}\nӨнөөдөр хийх ${pending.length} даалгавар байна.\n${pending.map(t=>`${t.time} · ${t.title}`).join('\n')}\nӨөрийн кабинетад нэвтэрч гүйцэтгэнэ үү.`,now());queued+=r.meta.changes||0;
  }
 }
 if(env.RESEND_API_KEY&&env.EMAIL_FROM){
 const entries=await all("SELECT * FROM email_outbox WHERE status IN ('queued','failed') AND attempts<5 ORDER BY created_at LIMIT 20");
 for(const x of entries){try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':x.id},body:JSON.stringify({from:env.EMAIL_FROM,to:[x.recipient],subject:x.subject,text:x.body})});if(!r.ok)throw new Error('Provider '+r.status);await run("UPDATE email_outbox SET status='sent',attempts=attempts+1,error='',sent_at=? WHERE id=?",now(),x.id);sent++}catch(e:any){await run("UPDATE email_outbox SET status='failed',attempts=attempts+1,error=? WHERE id=?",String(e.message).slice(0,300),x.id)}}
 }
 await run('DELETE FROM sessions WHERE expires_at<?',Date.now());await run('DELETE FROM rate_limits WHERE expires_at<?',Date.now()-86400000);
 return {date:day(),queued,sent,emailConfigured:!!(env.RESEND_API_KEY&&env.EMAIL_FROM)}
}
