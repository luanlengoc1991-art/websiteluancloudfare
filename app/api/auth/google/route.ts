import {NextResponse} from 'next/server';
import {cookieOptions} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {AuthError,authorizeUrl,createChallenge,oauthCookie,safeReturnTo} from '@/lib/google-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({error:'Yêu cầu không hợp lệ.'}, {status:403});
  const origin = new URL(process.env.ALPHA_PUBLIC_ORIGIN || request.url).origin;
  const fail = (error='google_unavailable') => NextResponse.redirect(new URL('/dang-nhap?error='+error, origin), 303);
  try {
    const {verifier, challenge, state} = createChallenge();
    const destination = safeReturnTo(new URL(request.url).searchParams.get('return_to'));
    const response = NextResponse.redirect(authorizeUrl({challenge, state, redirectUri: origin+'/auth/callback'}), 303);
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set(oauthCookie, JSON.stringify({verifier, state, destination, issued:Date.now()}), {...cookieOptions(), maxAge:600});
    return response;
  } catch (error) { return fail(error instanceof AuthError ? error.code : undefined); }
}
