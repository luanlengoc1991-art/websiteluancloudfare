import {NextResponse} from 'next/server';
import {cookieOptions} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {supabaseConfig} from '@/lib/supabase-server';
import {authRequest, createChallenge, oauthCookie, safeReturnTo} from '@/lib/google-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({error:'Yêu cầu không hợp lệ.'}, {status:403});
  const origin = new URL(process.env.ALPHA_PUBLIC_ORIGIN || request.url).origin;
  const fail = (error='google_unavailable') => NextResponse.redirect(new URL('/dang-nhap?error='+error, origin), 303);
  try {
    const settings = await (await authRequest('settings')).json();
    if (!settings.external?.google) return fail('google_disabled');
    const {url} = supabaseConfig();
    const {verifier, challenge} = createChallenge();
    const destination = safeReturnTo(new URL(request.url).searchParams.get('return_to'));
    const authorize = new URL(url + '/auth/v1/authorize');
    authorize.searchParams.set('provider', 'google');
    authorize.searchParams.set('redirect_to', origin + '/auth/callback');
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 's256');
    authorize.searchParams.set('prompt', 'select_account');
    const response = NextResponse.redirect(authorize, 303);
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set(oauthCookie, JSON.stringify({verifier, destination, kind:'google', issued:Date.now()}), {...cookieOptions(), maxAge:600});
    return response;
  } catch { return fail(); }
}
