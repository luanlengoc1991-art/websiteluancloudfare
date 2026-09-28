import {rest,eq,supabaseFetch,readAll} from '@/lib/supabase-server';
type Value=string|number|null;
class Statement {
 constructor(readonly sql:string,readonly values:Value[]=[] ){}
 bind(...values:Value[]){return new Statement(this.sql,values);}
 async all<T=Record<string,unknown>>(){return {results:await this.read() as T[]};}
 async first<T=Record<string,unknown>>(){return (await this.read())[0] as T||null;}
 private async read(){
  const s=this.sql,v=this.values;
  if(s.includes('FROM records')) {
   const kind=s.match(/kind='([^']+)'/)?.[1];
   const id=s.includes('id=?')?v[1]:s.includes("id='main'")?'main':null;
   return readAll('alpha_records?owner='+eq(v[0])+(kind?'&kind='+eq(kind):'')+(id!==null?'&id='+eq(id):'')+'&select=kind,id,payload&order=updated.desc,id.asc');
  }
  if(s.includes('FROM reservations')) {
   return rest('alpha_reservations?owner='+eq(v[0])+(s.includes('unit_id=?')?'&unit_id='+eq(v[1])+'&status='+eq('Đang giữ chỗ')+'&expires_at=gt.'+v[2]:'')+'&order=created_at.desc&limit=500');
  }
  if(s.includes('FROM files')){
   const single=s.includes('id=? AND owner=?');
   const rows=await readAll('alpha_files?'+(single?'id='+eq(v[0])+'&owner='+eq(v[1]):'owner='+eq(v[0]))+'&order=id.asc');
   return rows.map((r:Record<string,unknown>)=>({...r,projectId:r.project_id}));
  }
  throw Error('Unsupported database read');
 }
 record(){const [owner,kind,id,payload,updated]=this.values;return {owner,kind,id,payload,updated};}
 async run(){
  const s=this.sql,v=this.values;let rows;
  if(s.startsWith('INSERT INTO records')){await rest('rpc/alpha_save_records','POST',{p_rows:[this.record()]});rows=[this.record()];}
  else if(s.startsWith('INSERT INTO files')){const [id,owner,project_id,kind,name,mime,object_key]=v;rows=await rest('alpha_files','POST',{id,owner,project_id,kind,name,mime,object_key});}
  else if(s.startsWith('INSERT INTO reservations'))return {success:true,meta:{changes:await rest('rpc/alpha_reserve','POST',{p_id:v[0],p_owner:v[1],p_unit:v[2],p_customer:v[3],p_note:v[4],p_expires:v[5],p_now:v[6]})}};
  else if(s.startsWith('UPDATE reservations'))return {success:true,meta:{changes:await rest('rpc/alpha_reservation','POST',{p_id:v[3],p_owner:v[4],p_operation:v[1],p_now:v[5]})}};
  else throw Error('Unsupported database write');
  return {success:true,meta:{changes:rows?.length||0}};
 }
}
export function database(){return {prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){if(statements.some(s=>!s.sql.startsWith('INSERT INTO records')))throw Error('Unsupported batch');await rest('rpc/alpha_save_records','POST',{p_rows:statements.map(s=>s.record())});return statements.map(()=>({success:true}));}};}
const objectPath=(key:string)=>'/storage/v1/object/alpha-assets/'+key.split('/').map(encodeURIComponent).join('/');
export function bucket(){return {
 async put(key:string,data:ArrayBuffer,options?:{httpMetadata?:{contentType?:string}}){await supabaseFetch(objectPath(key),{method:'POST',headers:{'Content-Type':options?.httpMetadata?.contentType||'application/octet-stream','x-upsert':'false'},body:data});},
 async get(key:string){const r=await supabaseFetch(objectPath(key));return {body:new Uint8Array(await r.arrayBuffer())};},
 async delete(key:string){await supabaseFetch(objectPath(key),{method:'DELETE'});}
};}
