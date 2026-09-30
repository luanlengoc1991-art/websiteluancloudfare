import {database} from '@/db/store';
const window=15*60*1000,maxAttempts=20;
/** Count one attempt for a key and report whether it is still under the 15 minute limit. */
export async function allowAttempt(id:string,now=Date.now()){
 const row=await database().prepare(
  'INSERT INTO login_limits(id,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET'
  +' attempts=CASE WHEN login_limits.reset_at<=? THEN 1 ELSE login_limits.attempts+1 END,'
  +' reset_at=CASE WHEN login_limits.reset_at<=? THEN ? ELSE login_limits.reset_at END'
  +' RETURNING attempts'
 ).bind(id,now+window,now,now,now+window).first<{attempts:number}>();
 return (row?.attempts??maxAttempts+1)<=maxAttempts;
}
export async function clearAttempts(id:string){await database().prepare('DELETE FROM login_limits WHERE id=?').bind(id).run();}
