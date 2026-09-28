import {isSameOrigin} from '@/lib/request-origin';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {sessionCookie,tokenHash,cookieOptions} from '@/lib/auth';
import {rest,eq} from '@/lib/supabase-server';
export async function POST(req:Request){
 if(!isSameOrigin(req))return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 const token=(await cookies()).get(sessionCookie)?.value;if(token)await rest('alpha_sessions?token_hash='+eq(tokenHash(token)),'DELETE');
 const response=NextResponse.redirect(new URL('/dang-nhap',req.url),303);response.cookies.set(sessionCookie,'',{...cookieOptions(),maxAge:0});return response;
}
