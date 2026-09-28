import {mockSupabase} from './mock-supabase.mjs';
const mock=await mockSupabase();
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,scryptSync,createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const dir=mkdtempSync(join(tmpdir(),'alpha-hub-test-'));
const password=randomBytes(20).toString('hex'),salt=randomBytes(16).toString('hex');
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin=`http://127.0.0.1:${port}`;let server,logs='',cookie='';
const env={...process.env,NODE_ENV:'production',ALPHA_ENABLE_PASSWORD_LOGIN:'true',NEXT_TELEMETRY_DISABLED:'1',SUPABASE_URL:mock.url,SUPABASE_SECRET_KEY:'test-only-key',ALPHA_PUBLIC_ORIGIN:origin,ALPHA_DATA_DIR:dir,ALPHA_ADMIN_EMAIL:'admin@example.test',ALPHA_ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`,ALPHA_SECURE_COOKIE:'false'};
async function start(){server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(logs);try{const r=await fetch(origin+'/api/state');if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error('Server did not start: '+logs);}
async function stop(){if(server&&server.exitCode===null){server.kill();await new Promise(r=>server.once('exit',r));}}
async function post(path,data,extra={}){return fetch(origin+path,{method:'POST',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},body:JSON.stringify(data)});}
try{
 await start();
 assert.equal((await post('/api/auth/google',{}, {Origin:'https://other.test'})).status,403);
 const googleStart=await post('/api/auth/google?return_to=%2Fadmin%2Fkhach-hang',{});
 assert.equal(googleStart.status,303);
 const oauthLocation=new URL(googleStart.headers.get('location'));
 assert.equal(oauthLocation.searchParams.get('provider'),'google');
 assert.equal(oauthLocation.searchParams.get('redirect_to'),origin+'/auth/callback');
 const flowCookie=googleStart.headers.getSetCookie().find(c=>c.startsWith('alpha_google_pkce=')).split(';')[0];
 const flow=JSON.parse(decodeURIComponent(flowCookie.slice(flowCookie.indexOf('=')+1)));
 assert.equal(oauthLocation.searchParams.get('code_challenge'),createHash('sha256').update(flow.verifier).digest('base64url'));
 const callback=(code,authCookie=flowCookie)=>fetch(origin+'/auth/callback?code='+code,{redirect:'manual',headers:{Cookie:authCookie}});
 const adminUser={id:'admin-auth-id',email:'admin@example.test',email_confirmed_at:new Date().toISOString(),identities:[{provider:'google'}]};
 mock.issueCode('wrong-email',flow.verifier,{...adminUser,email:'stranger@example.test',user_metadata:{email:'admin@example.test'}});
 const memberGoogle=await callback('wrong-email');assert.equal(memberGoogle.headers.get('location'),origin+'/tai-khoan');const memberGoogleCookie=memberGoogle.headers.getSetCookie().find(c=>c.startsWith('alpha_session=')).split(';')[0];assert.equal((await(await fetch(origin+'/api/state',{headers:{Cookie:memberGoogleCookie}})).json()).user,null);
 mock.issueCode('unverified',flow.verifier,{...adminUser,email_confirmed_at:null});assert.match((await callback('unverified')).headers.get('location'),/google_forbidden/);
 mock.issueCode('not-google',flow.verifier,{...adminUser,identities:[{provider:'email'}]});assert.match((await callback('not-google')).headers.get('location'),/google_forbidden/);
 assert.match((await callback('missing-cookie','')).headers.get('location'),/google_cancelled/);
 mock.issueCode('success',flow.verifier,adminUser);
 const googleLogin=await callback('success');assert.equal(googleLogin.headers.get('location'),origin+'/admin/khach-hang');
 const googleSession=googleLogin.headers.getSetCookie().find(c=>c.startsWith('alpha_session='));assert.match(googleSession,/HttpOnly/);
 const googleState=await(await fetch(origin+'/api/state',{headers:{Cookie:googleSession.split(';')[0]}})).json();assert.equal(googleState.user.email,adminUser.email);
 assert.match((await callback('success')).headers.get('location'),/google_failed/);
 const unsafeStart=await post('/api/auth/google?return_to='+encodeURIComponent('//evil.test'),{});
 const unsafeCookie=unsafeStart.headers.getSetCookie().find(c=>c.startsWith('alpha_google_pkce=')).split(';')[0];
 const unsafeFlow=JSON.parse(decodeURIComponent(unsafeCookie.slice(unsafeCookie.indexOf('=')+1)));assert.equal(unsafeFlow.destination,'/tai-khoan');
 const anonymous=await fetch(origin+'/api/state',{headers:{'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'fake@example.test'}});assert.equal((await anonymous.json()).user,null);
 assert.equal((await post('/api/action',{action:'save'})).status,401);
 assert.equal((await post('/api/auth/admin-password',{email:'admin@example.test',password:'incorrect'})).status,401);
 assert.equal((await post('/api/auth/admin-password',{email:'admin@example.test',password},{Origin:'https://other.test'})).status,403);
 const login=await post('/api/auth/admin-password',{email:'admin@example.test',password});assert.equal(login.status,200);const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);cookie=setCookie.split(';')[0];

 // Public signup, verification and password login; user metadata cannot grant admin.
 const adminCookie=cookie;cookie='';
 assert.equal((await post('/api/auth/signup',{email:'member@example.test',password:'short',name:'Member'})).status,400);
 assert.equal((await post('/api/auth/signup',{email:'member@example.test',password:'long-password',name:'Member'},{Origin:'https://other.test'})).status,403);
 const signup=await post('/api/auth/signup',{email:'member@example.test',password:'long-password',name:'Member'});assert.equal(signup.status,200);assert.match((await signup.json()).message,/xác nhận/);
 assert.equal((await post('/api/auth/login',{email:'member@example.test',password:'long-password'})).status,401);
 const signupCookie=signup.headers.getSetCookie().find(c=>c.startsWith('alpha_google_pkce=')).split(';')[0];
 const signupFlow=JSON.parse(decodeURIComponent(signupCookie.slice(signupCookie.indexOf('=')+1)));
 mock.confirmEmail('member@example.test',signupFlow.verifier);
 const confirmation=await callback('confirm-member@example.test',signupCookie);assert.equal(confirmation.headers.get('location'),origin+'/tai-khoan');
 assert.equal((await post('/api/auth/login',{email:'member@example.test',password:'incorrect'})).status,400);
 const memberLogin=await post('/api/auth/login',{email:'member@example.test',password:'long-password'});assert.equal(memberLogin.status,200);
 cookie=memberLogin.headers.getSetCookie().find(c=>c.startsWith('alpha_session=')).split(';')[0];
 const memberState=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert.equal(memberState.user,null);assert.equal(memberState.member.email,'member@example.test');
 assert.match(await(await fetch(origin+'/tai-khoan',{headers:{Cookie:cookie}})).text(),/member@example.test/);
 assert.equal((await post('/api/action',{action:'save',kind:'customer',id:'unauthorized',data:{}})).status,401);
 assert.equal((await post('/api/upload',{})).status,401);
 const memberAdminPage=await fetch(origin+'/admin',{headers:{Cookie:cookie},redirect:'manual'});assert([200,307].includes(memberAdminPage.status));assert(!(await memberAdminPage.text()).includes('admin-sidebar'));
 const memberLogout=await post('/api/auth/logout',{});assert.equal(memberLogout.status,303);assert.equal((await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json()).member,null);
 cookie=adminCookie;
 const customer={id:'test-customer',name:'Khách kiểm thử',phone:'0900000000',email:'',note:'',stage:'Mới'};
 assert.equal((await post('/api/action',{action:'save',kind:'customer',id:customer.id,data:customer})).status,200);
 const holds=await Promise.all([post('/api/action',{action:'reserve',unitId:'u-2-0',customerId:customer.id}),post('/api/action',{action:'reserve',unitId:'u-2-0',customerId:customer.id})]);assert.deepEqual(holds.map(r=>r.status).sort(),[200,409]);
 let state=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert.equal(state.records.find(r=>r.id===customer.id).data.name,customer.name);const hold=state.reservations[0];
 for(const operation of ['extend','cancel'])assert.equal((await post('/api/action',{action:'reservation',id:hold.id,operation})).status,200);
 const form=new FormData();form.set('projectId','green-paradise');form.set('kind','document');form.set('file',new Blob(['%PDF-1.4 test'],{type:'application/pdf'}),'sample.pdf');
 const upload=await fetch(origin+'/api/upload',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:form});assert.equal(upload.status,200);const fileId=(await upload.json()).id;
 assert.equal((await fetch(origin+'/api/files/'+fileId)).status,404);
 assert.equal(await(await fetch(origin+'/api/files/'+fileId,{headers:{Cookie:cookie}})).text(),'%PDF-1.4 test');
 for(const path of ['/du-an','/quy-hang','/du-an/masteri-grand-coast/quy-can-360','/du-an/masteri-grand-coast/bang-hang','/dang-nhap']){const page=await fetch(origin+path);assert.equal(page.status,200);assert.match(await page.text(),/Alpha/);}

 const redirect=await fetch(origin+'/admin',{redirect:'manual'});assert([200,307].includes(redirect.status));const redirectHtml=await redirect.text();if(redirect.status===200){assert.match(redirectHtml,/NEXT_REDIRECT|http-equiv="refresh"/);assert(!redirectHtml.includes('admin-sidebar'));}
 const publicState=await(await fetch(origin+'/api/state')).json();assert.equal(publicState.records.some(r=>r.kind==='customer'),false);assert.equal(publicState.files.some(f=>f.id===fileId),false);
 for(const page of ['/admin','/admin/quan-ly-du-an','/admin/khach-hang','/admin/bai-viet']){const response=await fetch(origin+page,{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.match(await response.text(),/admin-sidebar/);}
 const lead=await post('/api/leads',{name:'Khách website kiểm thử',phone:'0900000001',email:'',note:'Tư vấn'});assert.equal(lead.status,201);
 const dataAfterLead=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert(dataAfterLead.records.some(r=>r.data.name==='Khách website kiểm thử'));
 await stop();await start();
 state=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert.equal(state.records.find(r=>r.id===customer.id).data.name,customer.name);assert.equal(state.files[0].id,fileId);
 const logout=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{Cookie:cookie,Origin:origin},redirect:'manual'});assert.equal(logout.status,303);
 assert.equal((await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json()).user,null);
 console.log('PASS (disposable Supabase HTTP fixture; not a live cloud test): member signup/verification/password login, member admin isolation, Google PKCE callback, admin email allowlist, rejected unverified/non-Google identities, one-time code, redirect safety, Next.js pages, optional password login, HttpOnly session, rejected spoofed identity, CSRF, customer persistence, atomic holds, extension/cancellation, protected upload/download, persistence after restart, logout revocation.');
}catch(error){console.error(error);process.exitCode=1;}finally{await stop();await mock.close();rmSync(dir,{recursive:true,force:true});}
