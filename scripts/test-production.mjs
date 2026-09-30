import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash, randomBytes, scryptSync} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mockGoogle} from './mock-google.mjs';

/**
 * Runs the real Worker on a local Cloudflare runtime with a disposable D1
 * database and R2 bucket. Nothing here touches the production account.
 */
const wrangler = join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const clientId = 'alpha-hub-test.apps.googleusercontent.com';
const adminEmail = 'admin@example.test';
const password = randomBytes(20).toString('hex');
const salt = randomBytes(16).toString('hex');
const state = mkdtempSync(join(tmpdir(), 'alpha-hub-state-'));
const configPath = join(process.cwd(), '.wrangler-test.json');

const google = await mockGoogle(clientId);
const probe = createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;

// The test config adds the R2 bucket the deployed Worker gets once R2 is enabled.
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
config.r2_buckets = [{binding: 'MEDIA', bucket_name: 'alpha-assets'}];
writeFileSync(configPath, JSON.stringify(config, null, 2));

const vars = {
  ALPHA_PUBLIC_ORIGIN: origin,
  ALPHA_ADMIN_EMAIL: adminEmail,
  ALPHA_ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`,
  ALPHA_ENABLE_PASSWORD_LOGIN: 'true',
  ALPHA_SECURE_COOKIE: 'false',
  GOOGLE_CLIENT_ID: clientId,
  GOOGLE_CLIENT_SECRET: 'test-only-secret',
  GOOGLE_OAUTH_BASE: google.url
};

let server, logs = '', cookie = '';
const run = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [wrangler, ...args], {stdio: ['ignore', 'pipe', 'pipe']});
  let output = '';
  child.stdout.on('data', (b) => (output += b));
  child.stderr.on('data', (b) => (output += b));
  child.on('exit', (code) => (code === 0 ? resolve(output) : reject(new Error(output))));
});
async function start() {
  logs = '';
  const args = ['dev', '-c', configPath, '--local', '--ip', '127.0.0.1', '--port', String(port), '--persist-to', state];
  for (const [key, value] of Object.entries(vars)) args.push('--var', `${key}:${value}`);
  server = spawn(process.execPath, [wrangler, ...args], {stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, CI: '1'}});
  server.stdout.on('data', (b) => (logs += b));
  server.stderr.on('data', (b) => (logs += b));
  for (let i = 0; i < 300; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(origin + '/api/state')).status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Worker did not start: ' + logs);
}
async function stop() {
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((r) => server.once('exit', r));
  }
}
const post = (path, data, extra = {}) => fetch(origin + path, {
  method: 'POST', redirect: 'manual',
  headers: {Origin: origin, 'Content-Type': 'application/json', ...(cookie ? {Cookie: cookie} : {}), ...extra},
  body: JSON.stringify(data)
});
const readState = (jar = cookie) => fetch(origin + '/api/state', {headers: jar ? {Cookie: jar} : {}}).then((r) => r.json());

try {
  if (!existsSync(join('.open-next', 'worker.js'))) {
    console.log('Đang dựng Worker để kiểm thử...');
    await new Promise((resolve, reject) => {
      const build = spawn('npm', ['run', 'build:worker'], {stdio: 'inherit', shell: true});
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('opennextjs-cloudflare build thất bại.'))));
    });
  }
  await run(['d1', 'migrations', 'apply', 'alpha-hub', '--local', '-c', configPath, '--persist-to', state]);
  await start();

  // Google sign-in: PKCE, state binding, one-time codes and the admin allowlist.
  assert.equal((await post('/api/auth/google', {}, {Origin: 'https://other.test'})).status, 403);
  const startGoogle = await post('/api/auth/google?return_to=%2Fadmin%2Fkhach-hang', {});
  assert.equal(startGoogle.status, 303);
  const authorize = new URL(startGoogle.headers.get('location'));
  assert.equal(authorize.origin + authorize.pathname, google.url + '/authorize');
  assert.equal(authorize.searchParams.get('redirect_uri'), origin + '/auth/callback');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  const flowCookie = startGoogle.headers.getSetCookie().find((c) => c.startsWith('alpha_google_pkce=')).split(';')[0];
  const flow = JSON.parse(decodeURIComponent(flowCookie.slice(flowCookie.indexOf('=') + 1)));
  assert.equal(authorize.searchParams.get('code_challenge'), createHash('sha256').update(flow.verifier).digest('base64url'));
  assert.equal(authorize.searchParams.get('state'), flow.state);
  const callback = (code, jar = flowCookie, value = flow.state) =>
    fetch(`${origin}/auth/callback?code=${code}&state=${encodeURIComponent(value)}`, {redirect: 'manual', headers: jar ? {Cookie: jar} : {}});

  google.issueCode('wrong-state', flow.verifier, {email: adminEmail, email_verified: true, sub: 'admin-id'});
  assert.match((await callback('wrong-state', flowCookie, 'forged')).headers.get('location'), /google_cancelled/);
  google.issueCode('unverified', flow.verifier, {email: 'someone@example.test', email_verified: false, sub: 'unverified-id'});
  assert.match((await callback('unverified')).headers.get('location'), /google_forbidden/);
  assert.match((await callback('missing-cookie', '')).headers.get('location'), /google_cancelled/);

  google.issueCode('member-google', flow.verifier, {email: 'google-member@example.test', email_verified: true, sub: 'member-id', name: 'Thành viên Google'});
  const memberGoogle = await callback('member-google');
  assert.equal(memberGoogle.headers.get('location'), origin + '/tai-khoan');
  const memberGoogleJar = memberGoogle.headers.getSetCookie().find((c) => c.startsWith('alpha_session=')).split(';')[0];
  const memberGoogleState = await readState(memberGoogleJar);
  assert.equal(memberGoogleState.user, null);
  assert.equal(memberGoogleState.member.email, 'google-member@example.test');

  google.issueCode('admin-google', flow.verifier, {email: adminEmail, email_verified: true, sub: 'admin-id', name: 'Quản trị'});
  const adminGoogle = await callback('admin-google');
  assert.equal(adminGoogle.headers.get('location'), origin + '/admin/khach-hang');
  const adminGoogleSession = adminGoogle.headers.getSetCookie().find((c) => c.startsWith('alpha_session='));
  assert.match(adminGoogleSession, /HttpOnly/);
  assert.equal((await readState(adminGoogleSession.split(';')[0])).user.email, adminEmail);
  assert.match((await callback('admin-google')).headers.get('location'), /google_failed/);

  const unsafe = await post('/api/auth/google?return_to=' + encodeURIComponent('//evil.test'), {});
  const unsafeCookie = unsafe.headers.getSetCookie().find((c) => c.startsWith('alpha_google_pkce=')).split(';')[0];
  assert.equal(JSON.parse(decodeURIComponent(unsafeCookie.slice(unsafeCookie.indexOf('=') + 1))).destination, '/tai-khoan');

  // A spoofed identity header must never authenticate anyone.
  assert.equal((await readState('')).user, null);
  assert.equal((await fetch(origin + '/api/state', {headers: {'oai-authenticated-user-email': adminEmail}}).then((r) => r.json())).user, null);
  assert.equal((await post('/api/action', {action: 'save'})).status, 401);

  // Optional administrator password.
  assert.equal((await post('/api/auth/admin-password', {email: adminEmail, password: 'incorrect'})).status, 401);
  assert.equal((await post('/api/auth/admin-password', {email: adminEmail, password}, {Origin: 'https://other.test'})).status, 403);
  const login = await post('/api/auth/admin-password', {email: adminEmail, password});
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  const adminCookie = login.headers.get('set-cookie').split(';')[0];

  // Member accounts live in D1 and never reach the admin area.
  assert.equal((await post('/api/auth/signup', {email: 'member@example.test', password: 'short', name: 'Member'})).status, 400);
  assert.equal((await post('/api/auth/signup', {email: 'member@example.test', password: 'long-password', name: 'Member'}, {Origin: 'https://other.test'})).status, 403);
  assert.equal((await post('/api/auth/signup', {email: adminEmail, password: 'long-password', name: 'Kẻ giả mạo'})).status, 409);
  const signup = await post('/api/auth/signup', {email: 'member@example.test', password: 'long-password', name: 'Member'});
  assert.equal(signup.status, 200);
  assert.equal((await signup.json()).redirect, '/tai-khoan');
  assert.equal((await post('/api/auth/signup', {email: 'member@example.test', password: 'long-password', name: 'Member'})).status, 409);
  assert.equal((await post('/api/auth/login', {email: 'member@example.test', password: 'incorrect'})).status, 401);
  const memberLogin = await post('/api/auth/login', {email: 'member@example.test', password: 'long-password'});
  assert.equal(memberLogin.status, 200);
  cookie = memberLogin.headers.getSetCookie().find((c) => c.startsWith('alpha_session=')).split(';')[0];
  const memberState = await readState();
  assert.equal(memberState.user, null);
  assert.equal(memberState.member.email, 'member@example.test');
  assert.match(await fetch(origin + '/tai-khoan', {headers: {Cookie: cookie}}).then((r) => r.text()), /member@example.test/);
  assert.equal((await post('/api/action', {action: 'save', kind: 'customer', id: 'unauthorized', data: {}})).status, 401);
  assert.equal((await post('/api/upload', {})).status, 401);
  const memberAdmin = await fetch(origin + '/admin', {headers: {Cookie: cookie}, redirect: 'manual'});
  assert([200, 307].includes(memberAdmin.status));
  assert(!(await memberAdmin.text()).includes('admin-sidebar'));
  assert.equal((await post('/api/auth/logout', {})).status, 303);
  assert.equal((await readState()).member, null);

  // Administrator data: records, atomic holds and uploads.
  cookie = adminCookie;
  const customer = {id: 'test-customer', name: 'Khách kiểm thử', phone: '0900000000', email: '', note: '', stage: 'Mới'};
  assert.equal((await post('/api/action', {action: 'save', kind: 'customer', id: customer.id, data: customer})).status, 200);
  const holds = await Promise.all([
    post('/api/action', {action: 'reserve', unitId: 'u-2-0', customerId: customer.id}),
    post('/api/action', {action: 'reserve', unitId: 'u-2-0', customerId: customer.id})
  ]);
  assert.deepEqual(holds.map((r) => r.status).sort(), [200, 409]);
  let snapshot = await readState();
  assert.equal(snapshot.records.find((r) => r.id === customer.id).data.name, customer.name);
  const hold = snapshot.reservations[0];
  for (const operation of ['extend', 'cancel']) assert.equal((await post('/api/action', {action: 'reservation', id: hold.id, operation})).status, 200);

  const form = new FormData();
  form.set('projectId', 'green-paradise');
  form.set('kind', 'document');
  form.set('file', new Blob(['%PDF-1.4 test'], {type: 'application/pdf'}), 'sample.pdf');
  const upload = await fetch(origin + '/api/upload', {method: 'POST', headers: {Cookie: cookie, Origin: origin}, body: form});
  assert.equal(upload.status, 200);
  const fileId = (await upload.json()).id;
  assert.equal((await fetch(origin + '/api/files/' + fileId)).status, 404);
  assert.equal(await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: cookie}}).then((r) => r.text()), '%PDF-1.4 test');

  // Website forms reach the administrator without exposing private records.
  const lead = await fetch(origin + '/api/leads', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify({name: 'Khách website kiểm thử', phone: '0900000001', email: '', note: 'Tư vấn'})});
  assert.equal(lead.status, 201);
  assert((await readState()).records.some((r) => r.data.name === 'Khách website kiểm thử'));
  const publicState = await readState('');
  assert.equal(publicState.records.some((r) => r.kind === 'customer'), false);
  assert.equal(publicState.files.some((f) => f.id === fileId), false);

  for (const path of ['/du-an', '/quy-hang', '/du-an/masteri-grand-coast/quy-can-360', '/du-an/masteri-grand-coast/bang-hang', '/dang-nhap']) {
    const page = await fetch(origin + path);
    assert.equal(page.status, 200, path);
    assert.match(await page.text(), /Alpha/);
  }
  for (const path of ['/admin', '/admin/quan-ly-du-an', '/admin/khach-hang', '/admin/bai-viet']) {
    const page = await fetch(origin + path, {headers: {Cookie: cookie}});
    assert.equal(page.status, 200, path);
    assert.match(await page.text(), /admin-sidebar/);
  }
  const anonymousAdmin = await fetch(origin + '/admin', {redirect: 'manual'});
  assert([200, 307].includes(anonymousAdmin.status));

  // D1 and R2 keep the data after the Worker restarts.
  await stop();
  await start();
  snapshot = await readState();
  assert.equal(snapshot.records.find((r) => r.id === customer.id).data.name, customer.name);
  assert.equal(snapshot.files[0].id, fileId);
  assert.equal(await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: cookie}}).then((r) => r.text()), '%PDF-1.4 test');
  assert.equal((await post('/api/auth/logout', {})).status, 303);
  assert.equal((await readState()).user, null);

  console.log('PASS (disposable local D1 + R2; not a live cloud test): Google PKCE with state binding, one-time codes, admin allowlist, rejected unverified identities, member signup/login in D1, member isolation from the admin area, rejected spoofed identity, CSRF, optional admin password, HttpOnly sessions, customer persistence, atomic holds, extension and cancellation, protected upload and download, website lead form, private records hidden from the public API, Next.js pages, persistence across restart, logout revocation.');
} catch (error) {
  console.error(error);
  if (logs) console.error(logs.slice(-4000));
  process.exitCode = 1;
} finally {
  await stop();
  await google.close();
  rmSync(configPath, {force: true});
  rmSync(state, {recursive: true, force: true});
}
