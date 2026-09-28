import {NextResponse} from 'next/server';
import {isSameOrigin} from './request-origin';
import {authRequest,AuthError,createChallenge,oauthCookie} from './google-auth';
import {cookieOptions,newSession,sessionCookie,sessionLifetime,tokenHash} from './auth';
import {rest} from './supabase-server';

const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
function authFailure(error:unknown){
 if(error instanceof AuthError){
  if(error.status===429)return fail('Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.',429);
  if(error.code==='email_not_confirmed')return fail('Vui lòng xác nhận email trước khi đăng nhập.',401);
  if(error.code==='email_address_not_authorized'||error.code==='unexpected_failure')return fail('Hệ thống chưa gửi được email xác nhận. Bạn có thể đăng ký ngay bằng Google.',503);
  if(error.code==='signup_disabled')return fail('Đăng ký email đang tạm đóng. Vui lòng thử bằng Google.',503);
  return fail('Không thể xác thực. Kiểm tra email, mật khẩu hoặc dùng Google.',400);
 }
 return fail('Kết nối đang gián đoạn. Vui lòng thử lại.',503);
}
async function credentials(req:Request,signup=false){
 if(!isSameOrigin(req))return {error:fail('Yêu cầu không hợp lệ.',403)};
 const raw=await req.text();if(raw.length>4096)return {error:fail('Yêu cầu quá lớn.',413)};
 let data;try{data=JSON.parse(raw);}catch{return {error:fail('Thông tin chưa hợp lệ.')}}
 if(!data||typeof data.email!=='string'||typeof data.password!=='string')return {error:fail('Vui lòng nhập email và mật khẩu.')};
 const email=data.email.trim().toLowerCase(),password=data.password;
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||password.length>128||password.length<(signup?8:1))return {error:fail('Nhập email hợp lệ và mật khẩu '+(signup?'từ 8 đến 128 ký tự.':'hợp lệ.'))};
 const name=typeof data.name==='string'?data.name.trim().slice(0,100):'';
 if(signup&&!name)return {error:fail('Vui lòng nhập họ và tên.')};
 const allowed=await rest('rpc/alpha_login_attempt','POST',{p_id:'member:'+tokenHash(email),p_now:Date.now()});
 if(!allowed)return {error:fail('Thử quá nhiều lần. Vui lòng đợi 15 phút.',429)};
 return {email,password,name};
}
async function loginResponse(accessToken:string){
 const user=await(await authRequest('user',{headers:{Authorization:`Bearer ${accessToken}`}})).json();
 if(!user.email_confirmed_at||typeof user.id!=='string'||typeof user.email!=='string')return fail('Vui lòng xác nhận email trước khi đăng nhập.',401);
 // Email/password sessions are always members. Admin access requires the approved Google identity.
 const response=NextResponse.json({ok:true,redirect:'/tai-khoan'},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(sessionCookie,await newSession(user.email.trim().toLowerCase(),user.id),{...cookieOptions(),maxAge:sessionLifetime});
 return response;
}
export async function passwordLogin(req:Request){try{
 const data=await credentials(req);if(data.error)return data.error;
 const tokens=await(await authRequest('token?grant_type=password',{method:'POST',body:JSON.stringify({email:data.email,password:data.password})})).json();
 if(typeof tokens.access_token!=='string')return fail('Không thể đăng nhập.',401);
 return await loginResponse(tokens.access_token);
}catch(error){return authFailure(error);}}
export async function signup(req:Request){try{
 const data=await credentials(req,true);if(data.error)return data.error;
 const {verifier,challenge}=createChallenge();
 const origin=new URL(process.env.ALPHA_PUBLIC_ORIGIN||req.url).origin;
 const result=await(await authRequest('signup?redirect_to='+encodeURIComponent(origin+'/auth/callback'),{method:'POST',body:JSON.stringify({email:data.email,password:data.password,data:{full_name:data.name},code_challenge:challenge,code_challenge_method:'s256'})})).json();
 if(typeof result.access_token==='string')return await loginResponse(result.access_token);
 const response=NextResponse.json({ok:true,message:'Nếu email đủ điều kiện đăng ký, bạn sẽ nhận được thư xác nhận. Hãy kiểm tra hộp thư và thư rác; mở liên kết trên trình duyệt này, sau đó đăng nhập.'},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(oauthCookie,JSON.stringify({verifier,destination:'/tai-khoan',kind:'signup',issued:Date.now()}),{...cookieOptions(),maxAge:3600});
 return response;
}catch(error){return authFailure(error);}}
