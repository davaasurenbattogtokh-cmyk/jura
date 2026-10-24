import {env} from '../../../lib/env';
import {equal,tokenHash,rate} from '../../../lib/auth';
import {runDailyJobs} from '../../../lib/jobs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(req:Request){
 const configured=env.MAINTENANCE_TOKEN;
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!configured||configured.length<32||!token||!equal(await tokenHash(token),await tokenHash(configured)))return Response.json({error:'Unauthorized'},{status:403});
 try{await rate('scheduled-maintenance',4,60);return Response.json(await runDailyJobs());}
 catch{return Response.json({error:'Maintenance failed'},{status:500});}
}
