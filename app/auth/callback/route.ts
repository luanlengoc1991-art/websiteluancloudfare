import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {cookieOptions, newSession, sessionCookie, sessionLifetime} from '@/lib/auth';
import {adminEmail, authRequest, oauthCookie, safeReturnTo} from '@/lib/google-auth';
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
    if (!/^[A-Za-z0-9_-]{43}$/.test(flow.verifier) || typeof flow.issued !== 'number' || Date.now()-flow.issued > (flow.kind==='signup'?3600000:600000) || flow.issued > Date.now()) return finish('/dang-nhap?error=google_expired');
    const tokens = await (await authRequest('token?grant_type=pkce', {method:'POST', body:JSON.stringify({auth_code:code, code_verifier:flow.verifier})})).json();
    if (typeof tokens.access_token !== 'string') throw new Error('Missing token');
    // Fetch authoritative user details. Never authorize from client-editable user_metadata.
    const user = await (await authRequest('user', {headers:{Authorization:`Bearer ${tokens.access_token}`}})).json();
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const googleIdentity = user.identities?.some((identity: {provider?:string}) => identity.provider === 'google');
    if (!user.email_confirmed_at || !email || typeof user.id!=='string' || (flow.kind!=='signup'&&!googleIdentity)) return finish('/dang-nhap?error=google_forbidden');
    const isAdmin = flow.kind!=='signup' && googleIdentity && email===adminEmail();
    const destination = isAdmin ? safeReturnTo(typeof flow.destination === 'string' ? flow.destination : '/admin') : '/tai-khoan';
    const response = finish(destination);
    response.cookies.set(sessionCookie, await newSession(email,isAdmin?'admin':user.id), {...cookieOptions(), maxAge:sessionLifetime});
    return response;
  } catch { return finish('/dang-nhap?error=google_failed'); }
}
