import {z} from 'zod';
import {bucket, database, readAll} from '@/db/store';
import {seedProjects, seedArticles, seedUnits, defaultSettings} from '@/lib/catalog';
import {backgroundPages} from '@/lib/site-backgrounds';
import {mediaLimit, MediaError, storeMedia} from '@/lib/media-storage';
import type {MediaTarget} from '@/lib/media-targets';

type Row = {kind: string; id: string; payload: string; updated: number};
const seeds: Record<string, {id: string; [key: string]: unknown}[]> = {project: seedProjects, article: seedArticles, unit: seedUnits};
export async function mediaTargets(): Promise<MediaTarget[]> {
  const rows = await readAll<Row>("SELECT kind,id,payload,updated FROM records WHERE owner='admin' AND kind IN ('project','article','unit','settings')");
  const merged = (kind: string) => {
    const data = new Map((seeds[kind] || []).map(item => [item.id, item]));
    rows.filter(r => r.kind === kind).forEach(r => data.set(r.id, JSON.parse(r.payload)));
    return [...data.values()];
  };
  const settings = rows.find(r => r.kind === 'settings' && r.id === 'main');
  const backgrounds = settings ? JSON.parse(settings.payload).backgrounds || {} : {};
  const targets: MediaTarget[] = [];
  for (const p of merged('project')) {
    targets.push({id: `project:${p.id}:cover`, label: `Ảnh đại diện · ${p.name}`, url: String(p.image || ''), scope: p.id, kind: 'gallery', recordKind: 'project', recordId: p.id, field: 'image'});
    for (const [kind, label] of [['gallery','Thư viện'],['plan','Mặt bằng'],['panorama','Ảnh 360°'],['model','Nhà mẫu'],['amenity','Tiện ích']]) targets.push({id: `project:${p.id}:${kind}`, label: `${label} · ${p.name}`, url: '', scope: p.id, kind});
  }
  for (const a of merged('article')) targets.push({id: `article:${a.id}:cover`, label: `Ảnh bài viết · ${a.title}`, url: String(a.image || ''), scope: 'site-library', kind: 'image', recordKind: 'article', recordId: a.id, field: 'image'});
  for (const u of merged('unit')) for (const [field,label] of [['posterUrl','Phiếu căn'],['layoutUrl','Mặt bằng căn']]) targets.push({id:`unit:${u.id}:${field}`,label:`${label} · ${u.code}`,url:String(u[field] || ''),scope:String(u.projectId),kind:'image',recordKind:'unit',recordId:u.id,field});
  for (const [page,label] of backgroundPages) targets.push({id:`background:${page}`,label:`Ảnh nền · ${label}`,url:backgrounds[page] || '',scope:'site-backgrounds',kind:'background',recordKind:'settings',recordId:'main',field:`backgrounds.${page}`});
  return targets;
}
export async function findMediaTarget(id: string) {
  const target = (await mediaTargets()).find(t => t.id === id);
  if (!target) throw new MediaError('Không tìm thấy vị trí ảnh. Hãy chọn lại từ danh sách.', 404);
  return target;
}
export async function mediaLibrary(query = '', limit = 50) {
  return (await database().prepare("SELECT id,name,mime,project_id,kind FROM files WHERE owner='admin' AND mime LIKE 'image/%' AND name LIKE ? ORDER BY rowid DESC LIMIT ?").bind(`%${query.slice(0,200)}%`, limit).all<{id:string;name:string;mime:string;project_id:string;kind:string}>()).results.map(f => ({...f,url:`/api/files/${f.id}`}));
}

/** Change only the requested JSON field; retain other edits. Audit and compare-and-set are atomic. */
export async function applyMedia(target: MediaTarget, fileId: string, actor: string, source: string, command = '') {
  const file = await database().prepare("SELECT id,mime,object_key,project_id,kind FROM files WHERE owner='admin' AND id=?").bind(fileId).first<{id:string;mime:string;object_key:string;project_id:string;kind:string}>();
  if (!file || !file.mime.startsWith('image/') || !await bucket().head(file.object_key)) throw new MediaError('Ảnh không có trong Cloudflare R2.',404);
  const db = database(), url = `/api/files/${fileId}`, operationId = crypto.randomUUID();
  const audit = (old: string, next: string) => db.prepare('INSERT INTO media_changes(id,target_id,file_id,previous_url,new_url,actor,source,command,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(operationId,target.id,fileId,old,next,actor,source,command.slice(0,4000),Date.now());
  if (!target.recordKind || !target.field) {
    if(file.project_id===target.scope&&file.kind===target.kind){await audit('',url).run();return {ok:true,operationId,targetId:target.id,label:target.label,url,previousUrl:'',fileId};}
    // A selected library file is copied into the gallery metadata, preserving its old membership.
    const id = crypto.randomUUID();
    await db.batch([db.prepare("INSERT INTO files(id,owner,project_id,kind,name,mime,object_key) SELECT ?,'admin',?,?,name,mime,object_key FROM files WHERE id=? AND owner='admin'").bind(id,target.scope,target.kind,fileId),audit('',`/api/files/${id}`)]);
    return {ok:true,operationId,targetId:target.id,label:target.label,url:`/api/files/${id}`,previousUrl:'',fileId:id};
  }
  const row = await db.prepare("SELECT payload,updated FROM records WHERE owner='admin' AND kind=? AND id=?").bind(target.recordKind,target.recordId!).first<{payload:string;updated:number}>();
  const fallback = target.recordKind === 'settings' ? {...defaultSettings,id:'main'} : seeds[target.recordKind]?.find(r=>r.id===target.recordId);
  if (!row && !fallback) throw new MediaError('Bản ghi không tồn tại.',404);
  const data = row ? JSON.parse(row.payload) : fallback;
  const previousUrl = target.field.startsWith('backgrounds.') ? data.backgrounds?.[target.field.slice(12)] || '' : data[target.field] || '';
  const path = '$.' + target.field;
  const now = Math.max(Date.now(), (row?.updated || 0)+1);
  const condition = row ? "EXISTS(SELECT 1 FROM records WHERE owner='admin' AND kind=? AND id=? AND updated=?)" : "NOT EXISTS(SELECT 1 FROM records WHERE owner='admin' AND kind=? AND id=?)";
  const values = row ? [target.recordKind,target.recordId!,row.updated] : [target.recordKind,target.recordId!];
  const log = db.prepare(`INSERT INTO media_changes(id,target_id,file_id,previous_url,new_url,actor,source,command,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE ${condition}`).bind(operationId,target.id,fileId,previousUrl,url,actor,source,command.slice(0,4000),now,...values);
  const mutation = row
    ? db.prepare("UPDATE records SET payload=json_set(payload,?,?),updated=? WHERE owner='admin' AND kind=? AND id=? AND updated=?").bind(path,url,now,target.recordKind,target.recordId!,row.updated)
    : db.prepare("INSERT INTO records(owner,kind,id,payload,updated) VALUES('admin',?,?,json_set(?,?,?),?) ON CONFLICT(owner,kind,id) DO NOTHING").bind(target.recordKind,target.recordId!,JSON.stringify(fallback),path,url,now);
  const result = await db.batch([log,mutation]);
  if (!result[1].meta.changes) throw new MediaError('Nội dung vừa được sửa ở nơi khác. Ảnh vẫn nằm trong Thư viện; hãy gửi lại lệnh.',409);
  return {ok:true,operationId,targetId:target.id,label:target.label,url,previousUrl,fileId};
}
export async function uploadForTarget(file: File, target: MediaTarget, actor: string, source: string, command: string) {
  // Keep the original visible in the library even if applying the change subsequently fails.
  const saved = await storeMedia(file,target.scope,target.kind,true);
  try { return await applyMedia(target,saved.id,actor,source,command); }
  catch (error) { if (error instanceof MediaError) throw new MediaError(`${error.message} Ảnh đã lưu: ${saved.url}`,error.status); throw error; }
}

export const attachmentSchema = z.object({download_url:z.string().url().max(8000),file_id:z.string().min(1).max(300),mime_type:z.string().max(100).optional(),file_name:z.string().max(200).optional()}).strict();
/** Trusted, expiring attachment links only. No internal URLs, credentials, arbitrary redirects or unbounded reads. */
function allowedAttachment(url: URL) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') return false;
  const host = url.hostname.toLowerCase();
  const extra = (process.env.ALPHA_MEDIA_SOURCE_HOSTS || '').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
  return host.endsWith('.oaiusercontent.com') || host === 'files.claudeusercontent.com' || /^(oaisdmntpr|oaisdsorpr|sdmntpr)[a-z0-9-]*\.blob\.core\.windows\.net$/.test(host) || /^(oaisdmntpr|sdmntpr)[a-z0-9.-]*\.s3\.[a-z0-9-]+\.amazonaws\.com$/.test(host) || extra.includes(host);
}
export async function attachmentFile(input: unknown) {
  const file = attachmentSchema.parse(input);
  let url = new URL(file.download_url);
  for (let hops=0;hops<4;hops++) {
    if (!allowedAttachment(url)) throw new MediaError('Link ảnh không thuộc kho đính kèm được cho phép. Dùng ảnh trong Thư viện hoặc tải trực tiếp trong quản trị.');
    const response = await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    if ([301,302,303,307,308].includes(response.status)) { await response.body?.cancel(); url=new URL(response.headers.get('location') || '',url); continue; }
    if (!response.ok || !response.body) throw new MediaError('Không đọc được ảnh đính kèm. Link có thể đã hết hạn.',400);
    if (Number(response.headers.get('content-length') || 0)>mediaLimit) { await response.body.cancel(); throw new MediaError('Ảnh tối đa 4 MB.',413); }
    const reader=response.body.getReader(),chunks:Uint8Array[]=[]; let size=0;
    try { while (true) { const {done,value}=await reader.read(); if (done) break; size+=value.length; if(size>mediaLimit)throw new MediaError('Ảnh tối đa 4 MB.',413); chunks.push(value); } } finally { await reader.cancel(); }
    const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new File([bytes],file.file_name || 'chat-image', {type:file.mime_type || response.headers.get('content-type')?.split(';')[0] || ''});
  }
  throw new MediaError('Link ảnh chuyển hướng quá nhiều lần.');
}
