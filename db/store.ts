import type {D1Database,R2Bucket} from '@cloudflare/workers-types';
import {getCloudflareContext} from '@opennextjs/cloudflare';

/**
 * Server-only Cloudflare storage. D1 holds the records, R2 holds uploaded files.
 * The bindings are read as optional so a missing one fails with a readable
 * message instead of a blank 500.
 */
const bindings=()=>getCloudflareContext().env as unknown as {DB?:D1Database;MEDIA?:R2Bucket};
export function database(){
 const db=bindings().DB;
 if(!db)throw new Error('Chưa cấu hình kết nối dữ liệu trên máy chủ.');
 return db;
}
export function bucket(){
 const media=bindings().MEDIA;
 if(!media)throw new Error('Chưa cấu hình kho tài liệu trên máy chủ.');
 return media;
}
/** Read every row of a large table without holding one huge D1 response in memory. */
export async function readAll<T>(sql:string,...values:(string|number|null)[]){
 const rows:T[]=[];
 for(let offset=0;;offset+=500){
  const page=await database().prepare(sql+' LIMIT 500 OFFSET '+offset).bind(...values).all<T>();
  rows.push(...page.results);
  if(page.results.length<500)return rows;
 }
}
