import {bucket, database} from '@/db/store';
import {seedProjects} from '@/lib/catalog';

export const mediaLimit = 10 * 1024 * 1024;
import {MediaError} from '@/lib/media-error';
export {MediaError} from '@/lib/media-error';
export const mediaKinds = ['gallery', 'plan', 'panorama', 'document', 'model', 'amenity', 'background', 'image'] as const;
export type MediaKind = typeof mediaKinds[number];

export async function validateMediaScope(projectId: string, kind: string, isAdmin: boolean) {
  if (!projectId || projectId.length > 100 || !mediaKinds.includes(kind as MediaKind)) throw new MediaError('Chọn dự án và loại ảnh hợp lệ.');
  if (kind === 'background' && !isAdmin) throw new MediaError('Chỉ quản trị được đổi ảnh nền website.', 403);
  if (projectId === 'site-library' && kind === 'image' || projectId === 'site-backgrounds' && kind === 'background') return;
  if (!seedProjects.some(p => p.id === projectId) && !await database().prepare("SELECT id FROM records WHERE owner='admin' AND kind='project' AND id=?").bind(projectId).first()) throw new MediaError('Dự án không tồn tại.');
}

/** A renamed HTML/SVG file must never become a public image. */
export function detectedMime(bytes: Uint8Array) {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  const head = new TextDecoder().decode(bytes.slice(0, 12));
  if (head.startsWith('RIFF') && head.slice(8) === 'WEBP') return 'image/webp';
  if (head.startsWith('%PDF-')) return 'application/pdf';
  throw new MediaError('File không phải ảnh JPG, PNG, WEBP hoặc PDF hợp lệ.');
}

/** R2 owns originals; D1 owns permanent IDs. Changing a reference never deletes an old file. */
export async function storeMedia(file: File, projectId: string, kind: string, isAdmin: boolean) {
  await validateMediaScope(projectId, kind, isAdmin);
  if (!file.size || file.size > mediaLimit) throw new MediaError('Tối đa 10 MB mỗi file.', 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectedMime(bytes);
  if (mime === 'application/pdf' && kind !== 'document') throw new MediaError('Chỉ loại Tài liệu nhận PDF.');
  if (file.type && file.type !== 'application/octet-stream' && file.type !== mime) throw new MediaError('Định dạng file không khớp nội dung.');
  const id = crypto.randomUUID(), key = `admin/${id}`;
  const name = file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200) || 'image';
  await bucket().put(key, bytes, {httpMetadata: {contentType: mime}});
  try {
    await database().prepare('INSERT INTO files(id,owner,project_id,kind,name,mime,object_key) VALUES(?,?,?,?,?,?,?)').bind(id, 'admin', projectId, kind, name, mime, key).run();
  } catch (error) {
    await bucket().delete(key);
    throw error;
  }
  return {id, url: `/api/files/${id}`, name, mime, projectId, kind};
}

export function mediaFailure(error: unknown) {
  if (error instanceof MediaError) return Response.json({error: error.message}, {status: error.status});
  console.error('Media storage operation failed', error instanceof Error ? error.name : 'UnknownError');
  return Response.json({error: 'Không thể lưu ảnh vào Cloudflare. Vui lòng thử lại; ảnh cũ vẫn được giữ.'}, {status: 503});
}

/** Ảnh hiển thị trong các tab dự án là nội dung riêng; chỉ xóa khi người quản trị bấm Xóa. */
const contentKinds = ['gallery', 'plan', 'panorama', 'model', 'amenity', 'document'];
const fileIds = (values: unknown[]) => [...new Set(values.flatMap(v => typeof v === 'string' ? [...v.matchAll(/\/api\/files\/([\w-]{8,64})/g)].map(m => m[1]) : []))];
async function dropObject(key: string) {
  if (!await database().prepare('SELECT 1 FROM files WHERE object_key=? LIMIT 1').bind(key).first()) await bucket().delete(key);
}
/** Xóa hẳn (D1 + R2) các file không còn bản ghi nào dùng. Mặc định bỏ qua ảnh thuộc tab dự án. Trả về id file vẫn đang được dùng. */
export async function purgeUnusedFiles(values: unknown[], force = false) {
  const db = database(), inUse: string[] = [];
  for (const id of fileIds(values)) {
    const file = await db.prepare("SELECT kind,object_key FROM files WHERE owner='admin' AND id=?").bind(id).first<{kind: string; object_key: string}>();
    if (!file || !force && contentKinds.includes(file.kind)) continue;
    if (await db.prepare("SELECT 1 FROM records WHERE owner='admin' AND kind<>'pin' AND instr(payload,?)>0 LIMIT 1").bind('/api/files/' + id).first()) { inUse.push(id); continue; }
    await db.prepare("DELETE FROM files WHERE owner='admin' AND id=?").bind(id).run();
    await dropObject(file.object_key);
  }
  return inUse;
}
/** Thay nội dung file nhưng giữ nguyên id/URL, rồi xóa bản cũ trong R2. */
export async function replaceMedia(file: File, id: string, isAdmin: boolean) {
  const db = database();
  const row = await db.prepare("SELECT project_id,kind,mime,object_key FROM files WHERE owner='admin' AND id=?").bind(id).first<{project_id: string; kind: string; mime: string; object_key: string}>();
  if (!row) throw new MediaError('Không tìm thấy file cần thay.', 404);
  if (row.kind === 'background' && !isAdmin) throw new MediaError('Chỉ quản trị được đổi ảnh nền website.', 403);
  if (!file.size || file.size > mediaLimit) throw new MediaError('Tối đa 10 MB mỗi file.', 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectedMime(bytes);
  if ((mime === 'application/pdf') !== (row.mime === 'application/pdf')) throw new MediaError(row.mime === 'application/pdf' ? 'Tài liệu chỉ thay bằng PDF.' : 'Ảnh chỉ thay bằng JPG, PNG hoặc WEBP.');
  const key = `admin/${crypto.randomUUID()}`, name = file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200) || 'image';
  await bucket().put(key, bytes, {httpMetadata: {contentType: mime}});
  try { await db.prepare("UPDATE files SET object_key=?,mime=?,name=? WHERE owner='admin' AND id=?").bind(key, mime, name, id).run(); }
  catch (error) { await bucket().delete(key); throw error; }
  await dropObject(row.object_key);
  return {id, url: `/api/files/${id}`, name, mime, projectId: row.project_id, kind: row.kind};
}
