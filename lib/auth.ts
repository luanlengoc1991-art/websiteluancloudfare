import {cookies} from 'next/headers';
import {randomBytes,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {database} from '@/db/store';
const derive=promisify(scrypt) as (password:string,salt:string,length:number)=>Promise<Buffer>;
export const sessionCookie='alpha_session';
export const sessionLifetime=7*24*60*60;
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function adminEmail(){return (process.env.ALPHA_ADMIN_EMAIL||'').trim().toLowerCase();}
export async function getSignedInUser(){
 const token=(await cookies()).get(sessionCookie)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const row=await database().prepare('SELECT owner,email,full_name FROM sessions WHERE token_hash=? AND expires>?').bind(tokenHash(token),Date.now()).first<{owner:string;email:string;full_name:string|null}>();
 if(!row)return null;
 const isAdmin=row.owner==='admin'&&row.email.toLowerCase()===adminEmail();
 if(row.owner==='admin'&&!isAdmin)return null;
 if(isAdmin)return {userId:row.owner,email:row.email,displayName:row.full_name||row.email,fullName:row.full_name,isAdmin:true,canEdit:true};
 const member=await database().prepare('SELECT can_edit FROM members WHERE id=? AND email=?').bind(row.owner,row.email).first<{can_edit:number}>();
 if(!member)return null;
 return {userId:row.owner,email:row.email,displayName:row.full_name||row.email,fullName:row.full_name,isAdmin:false,canEdit:member.can_edit===1};
}
/** Full administration stays on the allowlisted identity. A granted member is never an administrator. */
export async function getCurrentUser(){const user=await getSignedInUser();return user?.isAdmin?user:null;}
/** Site content edits: the administrator, or a member they explicitly allowed. */
export async function getContentEditor(){const user=await getSignedInUser();return user?.canEdit?user:null;}
/** scrypt:<salt>:<64-byte hash>, the format written by npm run setup. */
export async function hashPassword(password:string){
 const salt=randomBytes(16).toString('hex');
 return 'scrypt:'+salt+':'+(await derive(password,salt,64)).toString('hex');
}
export async function checkPassword(password:string,encoded:string|null|undefined){
 const [version,salt,hash]=(encoded||'').split(':');
 if(version!=='scrypt'||!salt||!hash||password.length>256)return false;
 const expected=Buffer.from(hash,'hex');if(expected.length!==64)return false;
 return timingSafeEqual(expected,await derive(password,salt,64));
}
export const verifyPassword=(password:string)=>checkPassword(password,process.env.ALPHA_ADMIN_PASSWORD_HASH);
export async function newSession(email:string,owner='admin',fullName:string|null=null){
 const token=randomBytes(32).toString('hex');
 const db=database();
 await db.batch([
  db.prepare('DELETE FROM sessions WHERE expires<=?').bind(Date.now()),
  db.prepare('INSERT INTO sessions(token_hash,owner,email,full_name,expires) VALUES(?,?,?,?,?)').bind(tokenHash(token),owner,email,fullName,Date.now()+sessionLifetime*1000)
 ]);
 return token;
}
export async function endSession(token:string|undefined){
 if(token&&/^[a-f0-9]{64}$/.test(token))await database().prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash(token)).run();
}
export function cookieOptions(){return {httpOnly:true,sameSite:'lax' as const,secure:process.env.ALPHA_SECURE_COOKIE==='true'||(process.env.NODE_ENV==='production'&&process.env.ALPHA_SECURE_COOKIE!=='false'),path:'/'};}
