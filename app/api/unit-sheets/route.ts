import {getSignedInUser} from '@/lib/auth';
import {database, readAll} from '@/db/store';
import {isSameOrigin} from '@/lib/request-origin';
import {seedProjects} from '@/lib/catalog';
import {mapSheetUnits, parseCsv, sheetCsvUrl, type UnitSheet} from '@/lib/unit-sheet';
export const dynamic = 'force-dynamic';

const save = (kind: string, id: string, data: unknown) => database().prepare('INSERT INTO records(owner,kind,id,payload,updated) VALUES(?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated').bind('admin', kind, id, JSON.stringify(data), Date.now()).run();

async function projectOf(id: string) {
  const seed = seedProjects.find(p => p.id === id);
  const row = await database().prepare("SELECT payload FROM records WHERE owner='admin' AND kind='project' AND id=?").bind(id).first<{payload: string}>();
  return row ? {...seed, ...JSON.parse(row.payload)} : seed;
}

/** Admin: sheet links + last sync of every project. */
export async function GET() {
  const user = await getSignedInUser();
  if (!user?.isAdmin) return Response.json({error: 'Chỉ quản trị viên.'}, {status: 403});
  const rows = await readAll<{kind: string; id: string; payload: string}>("SELECT kind,id,payload FROM records WHERE owner='admin' AND kind IN ('unit-sheet','unit-sheet-src')");
  const out: Record<string, {url?: string; syncedAt?: number; count?: number; error?: string}> = {};
  for (const r of rows) {const d = JSON.parse(r.payload); out[r.id] = {...out[r.id], ...(r.kind === 'unit-sheet-src' ? {url: d.url, error: d.error} : {syncedAt: d.syncedAt, count: d.count})};}
  return Response.json({sheets: out}, {headers: {'Cache-Control': 'no-store'}});
}

/** Admin: {projectId, url, action: 'sync' | 'clear'}. Sync always reads the sheet itself; the site then shows exactly its rows. */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return Response.json({error: 'Yêu cầu không hợp lệ.'}, {status: 403});
    const user = await getSignedInUser();
    if (!user?.isAdmin) return Response.json({error: 'Chỉ quản trị viên được đồng bộ Sheet.'}, {status: 403});
    const body = await request.json() as {projectId?: string; url?: string; action?: string};
    const project = await projectOf(String(body.projectId || ''));
    if (!project?.id) return Response.json({error: 'Dự án không tồn tại.'}, {status: 404});
    if (body.action === 'clear') {
      await database().batch([
        database().prepare("DELETE FROM records WHERE owner='admin' AND kind='unit-sheet' AND id=?").bind(project.id),
        database().prepare("DELETE FROM records WHERE owner='admin' AND kind='unit-sheet-src' AND id=?").bind(project.id),
      ]);
      return Response.json({ok: true});
    }
    const url = String(body.url || '').trim().slice(0, 2000);
    let csv: string;
    try {csv = sheetCsvUrl(url);} catch (e) {return Response.json({error: e instanceof Error ? e.message : 'Link không hợp lệ.'}, {status: 400});}
    await save('unit-sheet-src', project.id, {url});
    const res = await fetch(csv, {redirect: 'follow', signal: AbortSignal.timeout(20000), headers: {'User-Agent': 'AlphaHub-SheetSync'}});
    const text = res.ok ? await res.text() : '';
    if (!res.ok || /^\s*<!doctype html|<html/i.test(text)) {
      const error = 'Không đọc được Sheet. Hãy chia sẻ Sheet ở chế độ "Bất kỳ ai có đường liên kết đều xem được".';
      await save('unit-sheet-src', project.id, {url, error});
      return Response.json({error}, {status: 400});
    }
    const units = mapSheetUnits(project.id, project.category || 'low', parseCsv(text));
    if (!units.length) return Response.json({error: 'Sheet không có dòng mã căn nào.'}, {status: 400});
    const data: UnitSheet = {syncedAt: Date.now(), count: units.length, units};
    await save('unit-sheet', project.id, data);
    await save('unit-sheet-src', project.id, {url});
    return Response.json({ok: true, count: units.length, syncedAt: data.syncedAt, sample: units.slice(0, 5).map(u => u.code)});
  } catch (e) {
    console.error(e);
    return Response.json({error: e instanceof Error ? e.message : 'Không đồng bộ được Sheet.'}, {status: 500});
  }
}
