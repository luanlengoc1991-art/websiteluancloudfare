import {isSameOrigin} from '@/lib/request-origin';
import {NextResponse} from 'next/server';
import {verifyPassword,newSession,sessionCookie,sessionLifetime,cookieOptions} from '@/lib/auth';
import {rest,eq} from '@/lib/supabase-server';
export const runtime='nodejs';
export async function POST(req:Request){try{
 if(process.env.ALPHA_ENABLE_PASSWORD_LOGIN!=='true')return NextResponse.json({error:'Vui lòng đăng nhập bằng Google.'},{status:410});
 if(!isSameOrigin(req))return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Yêu cầu quá lớn.'},{status:413});
 const admin=(process.env.ALPHA_ADMIN_EMAIL||'').trim().toLowerCase();
 if(!admin||!process.env.ALPHA_ADMIN_PASSWORD_HASH)return NextResponse.json({error:'Chưa cấu hình tài khoản quản trị trên máy chủ.'},{status:503});
 let body;try{body=await req.json();}catch{return NextResponse.json({error:'Thông tin chưa hợp lệ.'},{status:400});}
 if(typeof body.email!=='string'||typeof body.password!=='string'||body.email.length>254||body.password.length>256)return NextResponse.json({error:'Thông tin chưa hợp lệ.'},{status:400});
 const allowed=await rest('rpc/alpha_login_attempt','POST',{p_id:'admin',p_now:Date.now()});
 if(!allowed)return NextResponse.json({error:'Thử quá nhiều lần. Vui lòng đợi 15 phút.'},{status:429});
 const valid=await verifyPassword(body.password);
 if(body.email.trim().toLowerCase()!==admin||!valid)return NextResponse.json({error:'Email hoặc mật khẩu không đúng.'},{status:401});
 await rest('alpha_login_limits?id='+eq('admin'),'DELETE');
 const res=NextResponse.json({ok:true});res.cookies.set(sessionCookie,await newSession(admin),{...cookieOptions(),maxAge:sessionLifetime});return res;
}catch(e){console.error(e);return NextResponse.json({error:'Không thể đăng nhập. Vui lòng kiểm tra kết nối máy chủ.'},{status:503});}}
