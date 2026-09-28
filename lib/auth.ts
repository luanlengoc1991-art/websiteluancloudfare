import {cookies} from 'next/headers';
import {randomBytes,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {rest,eq} from '@/lib/supabase-server';
const derive=promisify(scrypt);
export const sessionCookie='alpha_session';
export const sessionLifetime=7*24*60*60;
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function getSignedInUser(){
 const token=(await cookies()).get(sessionCookie)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const row=(await rest('alpha_sessions?token_hash='+eq(tokenHash(token))+'&expires=gt.'+Date.now()+'&select=owner,email'))[0];
 if(!row)return null;
 const isAdmin=row.owner==='admin'&&String(row.email).toLowerCase()===(process.env.ALPHA_ADMIN_EMAIL||'').trim().toLowerCase();
 if(row.owner==='admin'&&!isAdmin)return null;
 return {userId:String(row.owner),email:String(row.email),displayName:String(row.email),fullName:null,isAdmin};
}
/** Existing management endpoints intentionally accept administrators only. */
export async function getCurrentUser(){const user=await getSignedInUser();return user?.isAdmin?user:null;}
export async function verifyPassword(password:string){
 const encoded=process.env.ALPHA_ADMIN_PASSWORD_HASH||'';
 const [version,salt,hash]=encoded.split(':');
 if(version!=='scrypt'||!salt||!hash||password.length>256)return false;
 const expected=Buffer.from(hash,'hex');if(expected.length!==64)return false;
 const actual=await derive(password,salt,64) as Buffer;return timingSafeEqual(expected,actual);
}
export async function newSession(email:string,owner='admin'){
 const token=randomBytes(32).toString('hex');
 await rest('alpha_sessions?expires=lte.'+Date.now(),'DELETE');
 await rest('alpha_sessions','POST',{token_hash:tokenHash(token),owner,email,expires:Date.now()+sessionLifetime*1000});
 return token;
}
export function cookieOptions(){return {httpOnly:true,sameSite:'lax' as const,secure:process.env.ALPHA_SECURE_COOKIE==='true'||(process.env.NODE_ENV==='production'&&process.env.ALPHA_SECURE_COOKIE!=='false'),path:'/'};}
