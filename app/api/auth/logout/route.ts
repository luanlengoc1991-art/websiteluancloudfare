import {isSameOrigin} from '@/lib/request-origin';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {sessionCookie,endSession,cookieOptions} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!isSameOrigin(req))return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 await endSession((await cookies()).get(sessionCookie)?.value);
 const response=NextResponse.redirect(new URL('/dang-nhap',req.url),303);response.cookies.set(sessionCookie,'',{...cookieOptions(),maxAge:0});return response;
}
