import {getCurrentUser} from '@/lib/auth';
import {database} from '@/db/store';
import {isSameOrigin} from '@/lib/request-origin';
export const runtime = 'nodejs';

type Account = {id:string;email:string;full_name:string|null;provider:string;created_at:number;last_login_at:number|null;can_edit:number};
type Event = {email:string;full_name:string|null;created_at:number};

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) return Response.json({error:'Chỉ tài khoản quản trị được xem danh sách này.'}, {status:401, headers:{'Cache-Control':'no-store'}});
  const db = database();
  const [accounts, google] = await Promise.all([
    db.prepare('SELECT id,email,full_name,provider,created_at,last_login_at,can_edit FROM members ORDER BY created_at DESC LIMIT 100').all<Account>(),
    db.prepare("SELECT email,full_name,created_at FROM auth_events WHERE kind='google' ORDER BY created_at DESC LIMIT 80").all<Event>()
  ]);
  return Response.json({
    accounts: accounts.results.map((row) => ({id:row.id, email:row.email, fullName:row.full_name, provider:row.provider === 'google' ? 'google' : 'email', createdAt:row.created_at, lastLoginAt:row.last_login_at, canEdit:row.can_edit === 1})),
    google: google.results.map((row) => ({email:row.email, fullName:row.full_name, at:row.created_at}))
  }, {headers:{'Cache-Control':'no-store'}});
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({error:'Yêu cầu không hợp lệ.'}, {status:403});
  const admin = await getCurrentUser();
  if (!admin) return Response.json({error:'Chỉ tài khoản quản trị được cấp quyền.'}, {status:401});
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === 'string' ? body.id : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || typeof body?.canEdit !== 'boolean') {
    return Response.json({error:'Thông tin cấp quyền chưa hợp lệ.'}, {status:400});
  }
  const updated = await database().prepare('UPDATE members SET can_edit=? WHERE id=?').bind(body.canEdit ? 1 : 0, id).run();
  if (!updated.meta.changes) return Response.json({error:'Không tìm thấy tài khoản.'}, {status:404});
  return Response.json({ok:true, canEdit:body.canEdit}, {headers:{'Cache-Control':'no-store'}});
}
