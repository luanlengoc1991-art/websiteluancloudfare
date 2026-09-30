import {NextResponse} from 'next/server';
import {isSameOrigin} from './request-origin';
import {adminEmail,checkPassword,cookieOptions,hashPassword,newSession,sessionCookie,sessionLifetime,tokenHash,verifyPassword} from './auth';
import {allowAttempt} from './login-limits';
import {database} from '@/db/store';

const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function credentials(req:Request,signup=false){
 if(!isSameOrigin(req))return {error:fail('Yêu cầu không hợp lệ.',403)};
 const raw=await req.text();if(raw.length>4096)return {error:fail('Yêu cầu quá lớn.',413)};
 let data;try{data=JSON.parse(raw);}catch{return {error:fail('Thông tin chưa hợp lệ.')}}
 if(!data||typeof data.email!=='string'||typeof data.password!=='string')return {error:fail('Vui lòng nhập email và mật khẩu.')};
 const email=data.email.trim().toLowerCase(),password=data.password;
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||password.length>128||password.length<(signup?8:1))return {error:fail('Nhập email hợp lệ và mật khẩu '+(signup?'từ 8 đến 128 ký tự.':'hợp lệ.'))};
 const name=typeof data.name==='string'?data.name.trim().slice(0,100):'';
 if(signup&&!name)return {error:fail('Vui lòng nhập họ và tên.')};
 if(signup&&email===adminEmail())return {error:fail('Email này dành cho quản trị website, không thể tạo tài khoản thành viên.',409)};
 if(!await allowAttempt('member:'+tokenHash(email)))return {error:fail('Thử quá nhiều lần. Vui lòng đợi 15 phút.',429)};
 return {email,password,name};
}
/** Members never receive administrator access; that requires the allowlisted Google identity. */
async function memberSession(id:string,email:string,fullName:string|null){
 const response=NextResponse.json({ok:true,redirect:'/tai-khoan'},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(sessionCookie,await newSession(email,id,fullName),{...cookieOptions(),maxAge:sessionLifetime});
 return response;
}
export async function signup(req:Request){try{
 const data=await credentials(req,true);if(data.error)return data.error;
 const id=crypto.randomUUID();
 const created=await database().prepare('INSERT INTO members(id,email,password_hash,full_name,created_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO NOTHING')
  .bind(id,data.email,await hashPassword(data.password!),data.name||null,Date.now()).run();
 if(!created.meta.changes)return fail('Email này đã có tài khoản. Vui lòng đăng nhập.',409);
 return await memberSession(id,data.email!,data.name||null);
}catch(error){console.error(error);return fail('Kết nối đang gián đoạn. Vui lòng thử lại.',503);}}
/** The administrator signs in against the server-only password hash, never against a member row. */
async function adminSession(password:string){
 if(process.env.ALPHA_ENABLE_PASSWORD_LOGIN!=='true'||!process.env.ALPHA_ADMIN_PASSWORD_HASH)return fail('Tài khoản quản trị đăng nhập bằng Google.',410);
 if(!await verifyPassword(password))return fail('Email hoặc mật khẩu không đúng.',401);
 const response=NextResponse.json({ok:true,redirect:'/admin'},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(sessionCookie,await newSession(adminEmail()),{...cookieOptions(),maxAge:sessionLifetime});
 return response;
}
export async function passwordLogin(req:Request){try{
 const data=await credentials(req);if(data.error)return data.error;
 if(data.email===adminEmail())return await adminSession(data.password!);
 const member=await database().prepare('SELECT id,password_hash,full_name FROM members WHERE email=?').bind(data.email)
  .first<{id:string;password_hash:string|null;full_name:string|null}>();
 if(!member||!await checkPassword(data.password!,member.password_hash))return fail('Email hoặc mật khẩu không đúng.',401);
 return await memberSession(member.id,data.email!,member.full_name);
}catch(error){console.error(error);return fail('Kết nối đang gián đoạn. Vui lòng thử lại.',503);}}
/** Record a Google member so the account survives across sign-ins. */
export async function rememberGoogleMember(email:string,name:string|null){
 const member=await database().prepare('INSERT INTO members(id,email,password_hash,full_name,created_at) VALUES(?,?,NULL,?,?) ON CONFLICT(email) DO UPDATE SET full_name=COALESCE(excluded.full_name,members.full_name) RETURNING id,full_name')
  .bind(crypto.randomUUID(),email,name,Date.now()).first<{id:string;full_name:string|null}>();
 return member??{id:crypto.randomUUID(),full_name:name};
}
