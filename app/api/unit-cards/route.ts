import {getSignedInUser} from '@/lib/auth';
import {database} from '@/db/store';
import {isSameOrigin} from '@/lib/request-origin';
import {purgeUnusedFiles} from '@/lib/media-storage';
import {cardId, cleanCard} from '@/lib/unit-card';
export const dynamic = 'force-dynamic';

/** Admin: {projectId, code ('*' = project default), card | null}. Keeps the last saved version with time and author. */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return Response.json({error: 'Yêu cầu không hợp lệ.'}, {status: 403});
    const user = await getSignedInUser();
    if (!user?.isAdmin) return Response.json({error: 'Chỉ quản trị viên được vẽ căn.'}, {status: 403});
    const body = await request.json() as {projectId?: string; code?: string; card?: unknown};
    const projectId = String(body.projectId || '').slice(0, 100), code = String(body.code || '').slice(0, 60);
    if (!projectId || !code) return Response.json({error: 'Thiếu dự án hoặc mã căn.'}, {status: 400});
    const id = cardId(projectId, code), db = database();
    const old = await db.prepare("SELECT payload FROM records WHERE owner='admin' AND kind='unit-card' AND id=?").bind(id).first<{payload: string}>();
    if (body.card === null) await db.prepare("DELETE FROM records WHERE owner='admin' AND kind='unit-card' AND id=?").bind(id).run();
    else {
      const card = {...cleanCard(body.card), updatedAt: Date.now(), updatedBy: user.displayName || user.email};
      await db.prepare('INSERT INTO records(owner,kind,id,payload,updated) VALUES(?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated').bind('admin', 'unit-card', id, JSON.stringify(card), Date.now()).run();
    }
    // Images replaced in the card and used nowhere else are deleted (R2 + D1).
    if (old) await purgeUnusedFiles([old.payload]);
    return Response.json({ok: true});
  } catch (e) {
    console.error(e);
    return Response.json({error: 'Không lưu được phiếu căn.'}, {status: 500});
  }
}
