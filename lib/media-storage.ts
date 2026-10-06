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
