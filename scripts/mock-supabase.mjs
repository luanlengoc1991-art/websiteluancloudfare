// Disposable HTTP contract fixture. Does not connect to any real Supabase project.
import {createServer} from 'node:http';
export async function mockSupabase(){
 const tables={alpha_records:[],alpha_reservations:[],alpha_files:[],alpha_sessions:[],alpha_login_limits:[]},objects=new Map();
 const authCodes=new Map(),accessUsers=new Map(),members=new Map();
 const server=createServer(async(req,res)=>{try{
  if(req.headers.apikey!=='test-only-key'){res.writeHead(401).end();return;}
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks),url=new URL(req.url,'http://test'),path=url.pathname;
  const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(path.startsWith('/storage/v1/object/alpha-assets/')){if(req.method==='POST'){objects.set(path,raw);return send({});}if(req.method==='DELETE'){objects.delete(path);return send({});}if(!objects.has(path))return send({},404);res.writeHead(200).end(objects.get(path));return;}
  const data=raw.length?JSON.parse(raw):null;
  if(path==='/auth/v1/settings')return send({external:{google:true}});
  if(path==='/auth/v1/signup'){
   if(!members.has(data.email))members.set(data.email,{password:data.password,user:{id:'member-'+data.email,email:data.email,email_confirmed_at:null,identities:[{provider:'email'}],user_metadata:{role:'admin',email:'admin@example.test'}}});
   return send({id:'pending'});
  }
  if(path==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'){
   const member=members.get(data.email);if(!member||member.password!==data.password)return send({code:'invalid_credentials'},400);
   if(!member.user.email_confirmed_at)return send({code:'email_not_confirmed'},400);
   const access='password-'+data.email;accessUsers.set(access,member.user);return send({access_token:access});
  }
  if(path==='/auth/v1/token'){
   const grant=authCodes.get(data.auth_code);authCodes.delete(data.auth_code);
   if(!grant||grant.verifier!==data.code_verifier)return send({},400);
   const access='fixture-'+data.auth_code;accessUsers.set(access,grant.user);return send({access_token:access});
  }
  if(path==='/auth/v1/user'){
   const user=accessUsers.get((req.headers.authorization||'').replace('Bearer ',''));return send(user||{},user?200:401);
  }
  if(path==='/rest/v1/rpc/alpha_login_attempt'){let row=tables.alpha_login_limits.find(r=>r.id===data.p_id);if(!row){row={id:data.p_id,attempts:0};tables.alpha_login_limits.push(row);}row.attempts++;return send(row.attempts<=20);}
  if(path==='/rest/v1/rpc/alpha_save_records'){for(const row of data.p_rows){const index=tables.alpha_records.findIndex(r=>r.owner===row.owner&&r.kind===row.kind&&r.id===row.id);if(index<0)tables.alpha_records.push(row);else tables.alpha_records[index]=row;}return send(null);}
  if(path==='/rest/v1/rpc/alpha_reserve'){if(tables.alpha_reservations.some(r=>r.owner===data.p_owner&&r.unit_id===data.p_unit&&(r.status==='Đã bán'||(r.status==='Đang giữ chỗ'&&r.expires_at>data.p_now))))return send(0);tables.alpha_reservations.push({id:data.p_id,owner:data.p_owner,unit_id:data.p_unit,customer_id:data.p_customer,note:data.p_note,status:'Đang giữ chỗ',expires_at:data.p_expires,created_at:data.p_now});return send(1);}
  if(path==='/rest/v1/rpc/alpha_reservation'){const row=tables.alpha_reservations.find(r=>r.id===data.p_id&&r.owner===data.p_owner&&r.status==='Đang giữ chỗ'&&r.expires_at>data.p_now);if(!row)return send(0);if(data.p_operation==='extend')row.expires_at+=86400000;else row.status=data.p_operation==='sold'?'Đã bán':'Đã hủy';return send(1);}
  const name=path.split('/').pop(),rows=tables[name];if(!rows)return send({error:'Unknown resource'},404);
  const matches=row=>[...url.searchParams].every(([k,v])=>{if(['select','order','limit','offset','on_conflict'].includes(k))return true;const dot=v.indexOf('.'),op=v.slice(0,dot),value=v.slice(dot+1);if(op==='eq')return String(row[k])===value;if(op==='neq')return String(row[k])!==value;if(op==='gt')return row[k]>Number(value);if(op==='lte')return row[k]<=Number(value);if(op==='in')return value.slice(1,-1).split(',').includes(row[k]);throw Error('Unknown filter '+v);});
  if(req.method==='GET'){let out=rows.filter(matches);if(url.searchParams.has('offset'))out=out.slice(Number(url.searchParams.get('offset')));if(url.searchParams.has('limit'))out=out.slice(0,Number(url.searchParams.get('limit')));return send(out);}
  if(req.method==='DELETE'){const removed=rows.filter(matches);tables[name]=rows.filter(r=>!matches(r));return send(removed);}
  if(req.method==='POST'){const list=Array.isArray(data)?data:[data];rows.push(...list);return send(list);}
  send({},400);
 }catch(e){console.error(e);res.writeHead(500).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {url:'http://127.0.0.1:'+server.address().port,issueCode:(code,verifier,user)=>authCodes.set(code,{verifier,user}),confirmEmail:(email,verifier)=>{const member=members.get(email);member.user.email_confirmed_at=new Date().toISOString();authCodes.set('confirm-'+email,{verifier,user:member.user});},close:()=>new Promise(resolve=>server.close(resolve))};
}
