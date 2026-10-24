const token=process.env.MAINTENANCE_TOKEN;
if(!token||token.length<32)throw Error('MAINTENANCE_TOKEN must have at least 32 characters');
async function run(){try{
 const r=await fetch(process.env.MAINTENANCE_URL||'http://app:3000/api/maintenance',{method:'POST',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});
 const d=await r.json();if(!r.ok)throw Error('Maintenance HTTP '+r.status);
 console.log(JSON.stringify({date:d.date,queued:d.queued,sent:d.sent,emailConfigured:d.emailConfigured}));
}catch(e){console.error('Maintenance failed:',e.message);}}
await run();setInterval(run,60*60*1000);
