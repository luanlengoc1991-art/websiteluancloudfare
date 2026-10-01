import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash, randomBytes, scryptSync} from 'node:crypto';
import {mkdtempSync, rmSync} from 'node:fs';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mockGoogle} from './mock-google.mjs';
import {verifyPublicContent} from './public-content-test-helper.mjs';

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

const google = await mockGoogle(clientId);
const probe = createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;

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
  const args = ['dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--persist-to', state];
  for (const [key, value] of Object.entries(vars)) args.push('--var', `${key}:${value}`);
  server = spawn(process.execPath, [wrangler, ...args], {stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, CI: '1'}});
  server.stdout.on('data', (b) => (logs += b));
  server.stderr.on('data', (b) => (logs += b));
  for (let i = 0; i < 300; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(origin + '/api/state', {signal: AbortSignal.timeout(1500)})).status === 200) return;
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
  // OpenNext appends environment exports; discard the generated file before rebuilding.
  rmSync(join(process.cwd(), '.open-next', 'cloudflare', 'next-env.mjs'), {force: true});
  // Always rebuild: a stale bundle would test yesterday's code.
  console.log('Đang dựng Worker để kiểm thử...');
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build:worker'], {stdio: 'inherit', shell: true});
    build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('opennextjs-cloudflare build thất bại.'))));
  });
  await run(['d1', 'migrations', 'apply', 'alpha-hub', '--local', '--persist-to', state]);
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

  // The sign-in page reaches the administrator account without Google.
  assert.equal((await post('/api/auth/login', {email: adminEmail, password: 'incorrect'})).status, 401);
  const adminFormLogin = await post('/api/auth/login', {email: adminEmail, password});
  assert.equal(adminFormLogin.status, 200);
  assert.equal((await adminFormLogin.json()).redirect, '/admin');
  assert.equal((await readState(adminFormLogin.headers.getSetCookie().find((c) => c.startsWith('alpha_session=')).split(';')[0])).user.email, adminEmail);

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
  assert.equal(memberState.member.canEdit, false);
  assert.equal((await post('/api/action', {action: 'save', kind: 'customer', id: 'unauthorized', data: {}})).status, 403);
  assert.equal((await post('/api/upload', {})).status, 403);
  const memberCookie = cookie;
  assert.equal((await fetch(origin + '/api/admin/members', {headers: {Cookie: memberCookie}})).status, 401);
  assert.equal((await post('/api/admin/members', {id: '00000000-0000-4000-8000-000000000000', canEdit: true})).status, 401);
  const adminList = await fetch(origin + '/api/admin/members', {headers: {Cookie: adminCookie}});
  assert.equal(adminList.status, 200);
  const listed = await adminList.json();
  const emailAccount = listed.accounts.find((account) => account.email === 'member@example.test');
  const googleAccount = listed.accounts.find((account) => account.email === 'google-member@example.test');
  assert.equal(emailAccount.provider, 'email');
  assert.equal(emailAccount.canEdit, false);
  assert.equal(googleAccount.provider, 'google');
  assert.ok(listed.google.some((event) => event.email === 'google-member@example.test'));
  assert.ok(listed.google.some((event) => event.email === adminEmail));
  const about = {
    headline: 'Giới thiệu đã đồng bộ', introduction: 'Nội dung từ admin.', featuredProjectId: 'du-an-phan-quyen', featuredTagline: 'Dự án dùng chung', featuredScale: '100 ha',
    selectedProjectIds: ['green-paradise'], platformTitle: 'Nền tảng chung', platformBody: 'Nội dung nền tảng', journeyTitle: 'Hành trình', newsTitle: 'Tin mới',
    faq: [{question: 'Câu hỏi từ admin?', answer: 'Trả lời đã lưu.'}], contactTitle: 'Liên hệ', contactBody: 'Tư vấn từ backend.'
  };
  const guide = {id: 'guide-1', title: 'Hướng dẫn được đồng bộ', body: 'Nội dung được sửa trong admin.', order: 1, visible: true};
  const hiddenGuide = {id: 'guide-3', title: 'Hướng dẫn nháp cần ẩn', body: 'Nội dung nháp chưa công khai.', order: 3, visible: false};
  const grantedProject = {id: 'du-an-phan-quyen', name: 'Dự án được cấp phép', location: 'Cần Giờ', region: 'TP. Hồ Chí Minh', developer: 'Alpha', category: 'low', status: 'Đang mở bán', image: '', hot: false, description: 'Sửa bởi thành viên được cấp quyền.', lat: 10.4, lng: 106.91};
  cookie = adminCookie;
  assert.equal((await post('/api/admin/members', {id: emailAccount.id, canEdit: true})).status, 200);
  cookie = memberCookie;
  assert.equal((await post('/api/action', {action: 'save', kind: 'customer', id: 'unauthorized', data: {}})).status, 403);
  assert.equal((await post('/api/action', {action: 'save', kind: 'project', id: grantedProject.id, data: grantedProject})).status, 200);
  assert.equal((await readState('')).records.find((row) => row.id === grantedProject.id).data.name, grantedProject.name);
  assert.equal((await post('/api/action', {action: 'save', kind: 'about', id: 'main', data: about})).status, 200);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: guide.id, data: guide})).status, 200);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: hiddenGuide.id, data: hiddenGuide})).status, 200);
  assert.equal((await post('/api/action', {action: 'save', kind: 'settings', id: 'main', data: {}})).status, 403);
  assert.equal((await post('/api/action', {action: 'save', kind: 'about', id: 'other', data: about})).status, 400);
  assert.equal((await post('/api/action', {action: 'save', kind: 'about', id: 'main', data: {...about, featuredProjectId: 'missing-project'}})).status, 400);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: guide.id, data: {...guide, order: -1}})).status, 400);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: 'mismatch', data: guide})).status, 400);
  assert.equal((await readState()).records.find(row => row.id === hiddenGuide.id).data.body, hiddenGuide.body, 'Editors can still edit hidden guides');
  const publicContent = await readState('');
  assert.equal(publicContent.records.find(row => row.kind === 'about').data.headline, about.headline);
  assert.equal(publicContent.records.find(row => row.id === hiddenGuide.id).data.body, '', 'Draft guide text is private');
  for (const path of ['/admin/gioi-thieu', '/admin/huong-dan']) {
    const page = await fetch(origin + path, {headers: {Cookie: memberCookie}});
    assert.equal(page.status, 200, path);
    const html = await page.text();
    assert.match(html, /admin-sidebar/);
    assert.equal(html.includes('id="al-title"'), false, 'Public About must not duplicate inside the admin editor');
  }
  const editorDirectory = await fetch(origin + '/admin/thanh-vien', {headers: {Cookie: memberCookie}, redirect: 'manual'});
  const editorHtml = await editorDirectory.text();
  if (editorDirectory.status === 307) assert.match(editorDirectory.headers.get('location') || '', /quan-ly-du-an/);
  else assert.equal(editorHtml.includes('Tài khoản và phân quyền'), false, 'Thành viên được cấp quyền vẫn mở được danh sách tài khoản: ' + editorDirectory.status + ' ' + editorHtml.slice(0, 180));
  const editorPage = await fetch(origin + '/admin/quan-ly-du-an', {headers: {Cookie: memberCookie}});
  assert.equal(editorPage.status, 200);
  assert.match(await editorPage.text(), /admin-sidebar/);
  cookie = adminCookie;
  assert.equal((await post('/api/admin/members', {id: emailAccount.id, canEdit: false})).status, 200);
  cookie = memberCookie;
  assert.equal((await post('/api/action', {action: 'save', kind: 'project', id: grantedProject.id, data: {...grantedProject, name: 'Không được sửa'}})).status, 403);
  assert.equal((await readState('')).records.find((row) => row.id === grantedProject.id).data.name, grantedProject.name);
  assert.equal((await post('/api/action', {action: 'save', kind: 'about', id: 'main', data: about})).status, 403);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: guide.id, data: guide})).status, 403);
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

  const settings = {brand: 'Alpha chung', phone: '0900000012', email: 'contact@example.test', address: 'Địa chỉ chung', holdHours: 24, notifications: true, profileName: 'Tên riêng admin'};
  assert.equal((await post('/api/action', {action: 'save', kind: 'settings', id: 'main', data: settings})).status, 200);
  const contactState = await readState('');
  assert.equal(contactState.records.find(row => row.kind === 'settings').data.phone, settings.phone);
  assert.equal(contactState.records.find(row => row.kind === 'settings').data.profileName, undefined, 'Private settings remain private');
  verifyPublicContent(contactState, {headline: about.headline, projectName: grantedProject.name, phone: settings.phone, guideTitle: guide.title, hiddenTitle: hiddenGuide.title});
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: guide.id, data: {...guide, title: 'Hướng dẫn cập nhật lần hai'}})).status, 200);
  assert.equal((await readState('')).records.find(row => row.id === guide.id).data.title, 'Hướng dẫn cập nhật lần hai');
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: hiddenGuide.id, data: {...hiddenGuide, visible: true}})).status, 200);
  assert.equal((await readState('')).records.find(row => row.id === hiddenGuide.id).data.body, hiddenGuide.body);
  assert.equal((await post('/api/action', {action: 'save', kind: 'guide', id: hiddenGuide.id, data: hiddenGuide})).status, 200);

  const form = new FormData();
  form.set('projectId', 'green-paradise');
  form.set('kind', 'document');
  form.set('file', new Blob(['%PDF-1.4 test'], {type: 'application/pdf'}), 'sample.pdf');
  const upload = await fetch(origin + '/api/upload', {method: 'POST', headers: {Cookie: cookie, Origin: origin}, body: form});
  assert.equal(upload.status, 200);
  const fileId = (await upload.json()).id;
  assert.equal((await fetch(origin + '/api/files/' + fileId)).status, 404);
  assert.equal(await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: cookie}}).then((r) => r.text()), '%PDF-1.4 test');

  form.set('projectId', 'missing-project');
  assert.equal((await fetch(origin + '/api/upload', {method: 'POST', headers: {Cookie: cookie, Origin: origin}, body: form})).status, 400, 'Uploads cannot create orphan project assets');
  assert.equal((await post('/api/admin/members', {id: emailAccount.id, canEdit: true})).status, 200);
  const editorLogin = await post('/api/auth/login', {email: 'member@example.test', password: 'long-password'});
  assert.equal(editorLogin.status, 200);
  const editorCookie = editorLogin.headers.getSetCookie().find(value => value.startsWith('alpha_session=')).split(';')[0];
  assert.ok((await readState(editorCookie)).files.some(file => file.id === fileId), 'Editor library must show the protected documents it can access');
  assert.equal((await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: editorCookie}})).status, 200);
  assert.equal((await post('/api/admin/members', {id: emailAccount.id, canEdit: false})).status, 200);
  assert.equal((await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: editorCookie}})).status, 404);

  // Website forms reach the administrator without exposing private records.
  const lead = await fetch(origin + '/api/leads', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify({name: 'Khách website kiểm thử', phone: '0900000001', email: '', note: 'Tư vấn'})});
  assert.equal(lead.status, 201);
  assert((await readState()).records.some((r) => r.data.name === 'Khách website kiểm thử'));
  const publicState = await readState('');
  assert.equal(publicState.records.some((r) => r.kind === 'customer'), false);
  assert.equal(publicState.files.some((f) => f.id === fileId), false);

  for (const path of ['/gioi-thieu', '/huong-dan', '/tin-tuc', '/du-an', '/quy-hang', '/du-an/masteri-grand-coast/quy-can-360', '/du-an/masteri-grand-coast/bang-hang', '/dang-nhap']) {
    const page = await fetch(origin + path);
    assert.equal(page.status, 200, path);
    assert.match(await page.text(), /Alpha/);
  }
  for (const path of ['/admin', '/admin/gioi-thieu', '/admin/huong-dan', '/admin/quan-ly-du-an', '/admin/khach-hang', '/admin/bai-viet', '/admin/thanh-vien']) {
    const page = await fetch(origin + path, {headers: {Cookie: cookie}});
    assert.equal(page.status, 200, path);
    assert.match(await page.text(), /admin-sidebar/);
  }
  const anonymousAdmin = await fetch(origin + '/admin', {redirect: 'manual'});
  assert([200, 307].includes(anonymousAdmin.status));

  // An administrator edits a project, saves it, and the public page shows the change.
  const editedName = 'Dự án kiểm thử đã lưu';
  const project = {id: 'du-an-kiem-thu', name: 'Dự án kiểm thử', location: 'Cần Giờ', region: 'TP. Hồ Chí Minh', developer: 'Alpha', category: 'low', status: 'Đang mở bán', image: '', hot: false, description: 'Dự án tạo từ trang quản trị.', lat: 10.4, lng: 106.91};
  const saved = await post('/api/action', {action: 'save', kind: 'project', id: project.id, data: {...project, name: editedName}});
  assert.equal(saved.status, 200, 'save project');
  const publicProjects = await readState('');
  assert.equal(publicProjects.records.find((r) => r.kind === 'project' && r.id === project.id).data.name, editedName);
  const sharedUnit = {id: 'shared-unit', code: 'TEST-SHARED-001', projectId: project.id, category: 'low', zone: 'Phân khu kiểm thử', type: 'Liền kề', group: 'Quỹ kiểm thử', direction: 'Đông', area: 100, builtArea: 300, price: 8.3, status: 'Còn hàng', beds: 3, floor: 3, x: 30, y: 40, note: 'Ghi chú nội bộ'};
  const sharedArticle = {id: 'shared-article', title: 'Tin tức được lưu từ admin', category: 'Tin tức', body: 'Nội dung bài viết dùng chung.', date: '2026-10-01', image: ''};
  assert.equal((await post('/api/action', {action: 'save', kind: 'unit', id: sharedUnit.id, data: sharedUnit})).status, 200);
  assert.equal((await post('/api/action', {action: 'save', kind: 'article', id: sharedArticle.id, data: sharedArticle})).status, 200);
  const sharedState = await readState('');
  assert.equal(sharedState.records.find(row => row.id === sharedUnit.id).data.price, sharedUnit.price);
  assert.equal(sharedState.records.find(row => row.id === sharedUnit.id).data.note, '', 'Unit private notes remain hidden');
  assert.equal(sharedState.records.find(row => row.id === sharedArticle.id).data.body, sharedArticle.body);
  // The public page renders its data in the browser from /api/state.
  const page = await fetch(origin + '/du-an');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Danh sách dự án/);

  // D1 and R2 keep the data after the Worker restarts.
  await stop();
  await start();
  snapshot = await readState();
  assert.equal(snapshot.records.find((r) => r.id === customer.id).data.name, customer.name);
  assert.equal(snapshot.files[0].id, fileId);
  assert.equal(snapshot.records.find(row => row.kind === 'about').data.headline, about.headline);
  assert.equal(snapshot.records.find(row => row.id === guide.id).data.title, 'Hướng dẫn cập nhật lần hai');
  assert.equal(snapshot.records.find(row => row.id === sharedUnit.id).data.price, sharedUnit.price);
  assert.equal(snapshot.records.find(row => row.id === sharedArticle.id).data.title, sharedArticle.title);
  assert.equal(await fetch(origin + '/api/files/' + fileId, {headers: {Cookie: cookie}}).then((r) => r.text()), '%PDF-1.4 test');
  assert.equal((await post('/api/auth/logout', {})).status, 303);
  assert.equal((await readState()).user, null);

  console.log('PASS (disposable local D1 + R2; not a live cloud test): Google PKCE with state binding, one-time codes, admin allowlist, rejected unverified identities, member signup/login in D1, member isolation from the admin area, Google sign-in log, grant and revoke content edits, rejected spoofed identity, CSRF, optional admin password, HttpOnly sessions, customer persistence, atomic holds, extension and cancellation, protected upload and download, website lead form, private records hidden from the public API, shared About/Guides/contact content rendered by public components, hidden guide overrides, content route permissions and validation, Next.js pages, persistence across restart, logout revocation.');
} catch (error) {
  console.error(error);
  if (logs) console.error(logs.slice(-4000));
  process.exitCode = 1;
} finally {
  await stop();
  await google.close();
  rmSync(state, {recursive: true, force: true});
}
