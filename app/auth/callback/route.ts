import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {adminEmail, cookieOptions, newSession, sessionCookie, sessionLifetime} from '@/lib/auth';
import {exchangeCode, oauthCookie, readIdentity, safeReturnTo} from '@/lib/google-auth';
import {recordGoogleSignIn, rememberGoogleMember} from '@/lib/member-auth';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = new URL(process.env.ALPHA_PUBLIC_ORIGIN || request.url).origin;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.cookies.set(oauthCookie, '', {...cookieOptions(), maxAge:0});
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  try {
    const code = url.searchParams.get('code');
    const raw = (await cookies()).get(oauthCookie)?.value;
    if (url.searchParams.has('error') || !code || code.length > 2048 || !raw) return finish('/dang-nhap?error=google_cancelled');
    const flow = JSON.parse(raw);
    if (!/^[A-Za-z0-9_-]{43}$/.test(flow.verifier) || typeof flow.issued !== 'number' || Date.now()-flow.issued > 600000 || flow.issued > Date.now()) return finish('/dang-nhap?error=google_expired');
    if (typeof flow.state !== 'string' || flow.state !== url.searchParams.get('state')) return finish('/dang-nhap?error=google_cancelled');
    const identity = readIdentity(await exchangeCode(code, flow.verifier, origin+'/auth/callback'));
    if (!identity) return finish('/dang-nhap?error=google_forbidden');
    await recordGoogleSignIn(identity.email, identity.name);
    const isAdmin = identity.email === adminEmail();
    const member = isAdmin ? null : await rememberGoogleMember(identity.email, identity.name);
    const destination = isAdmin ? safeReturnTo(typeof flow.destination === 'string' ? flow.destination : '/admin') : '/tai-khoan';
    const response = finish(destination);
    response.cookies.set(sessionCookie, await newSession(identity.email, isAdmin ? 'admin' : member!.id, identity.name ?? member?.full_name ?? null), {...cookieOptions(), maxAge:sessionLifetime});
    return response;
  } catch { return finish('/dang-nhap?error=google_failed'); }
}
