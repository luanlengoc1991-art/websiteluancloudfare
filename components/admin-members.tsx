'use client';
import {useCallback, useEffect, useState} from 'react';
import {ShieldCheck, UserRound} from 'lucide-react';

type Account = {id:string;email:string;fullName:string|null;provider:'google'|'email';createdAt:number;lastLoginAt:number|null;canEdit:boolean};
type GoogleEvent = {email:string;fullName:string|null;at:number};

const when = (value:number|null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';

export default function AdminMembers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [google, setGoogle] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/members', {cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không tải được danh sách tài khoản.');
    setAccounts(data.accounts);
    setGoogle(data.google);
  }, []);

  useEffect(() => {
    load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Không tải được danh sách tài khoản.'));
  }, [load]);

  async function grant(account:Account) {
    setBusy(account.id);
    setError('');
    try {
      const response = await fetch('/api/admin/members', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:account.id, canEdit:!account.canEdit})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không cấp được quyền.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không cấp được quyền.');
    } finally {
      setBusy('');
    }
  }

  return <div className="admin-members">
    {error && <p className="auth-notice error" role="alert">{error}</p>}
    <div className="admin-columns">
      <section className="admin-panel">
        <div className="admin-panel-title"><div><h2>Đăng nhập Google gần đây</h2><p>Mỗi lần ai đó chọn tài khoản Google đều được ghi lại.</p></div><UserRound size={18}/></div>
        {google.length ? <div className="admin-activity">{google.map((event) => <div key={event.email + event.at}><span/><b>{event.fullName || event.email}</b><small>{event.email}</small><time>{when(event.at)}</time></div>)}</div> : <p className="admin-empty-line">Chưa có lượt đăng nhập Google.</p>}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title"><div><h2>Cách cấp quyền</h2><p>Tài khoản mới chỉ được xem website.</p></div><ShieldCheck size={18}/></div>
        <p className="admin-permission-note">Bấm <b>Cấp quyền chỉnh sửa</b> nếu muốn người đó sửa giới thiệu, dự án, quỹ căn, tin tức, hướng dẫn và thư viện. Khách hàng, giao dịch, cài đặt và danh sách tài khoản vẫn chỉ dành cho quản trị viên.</p>
      </section>
    </div>
    <section className="admin-panel">
      <div className="admin-panel-title"><div><h2>Tài khoản mới</h2><p>{accounts.length ? accounts.length + ' tài khoản, mới nhất ở trên.' : 'Chưa có thành viên nào.'}</p></div></div>
      {accounts.length ? <div className="table-wrap"><table><thead><tr><th>Tài khoản</th><th>Cách tạo</th><th>Thời điểm tạo</th><th>Lần vào gần nhất</th><th>Quyền</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><b>{account.fullName || 'Chưa có tên'}</b><small>{account.email}</small></td><td>{account.provider === 'google' ? 'Google' : 'Email và mật khẩu'}</td><td>{when(account.createdAt)}</td><td>{when(account.lastLoginAt)}</td><td><span className={'status ' + (account.canEdit ? 'available' : 'held')}>{account.canEdit ? 'Được sửa nội dung' : 'Chỉ xem'}</span><button className="button subtle" type="button" disabled={busy === account.id} onClick={() => grant(account)}>{busy === account.id ? 'Đang lưu…' : account.canEdit ? 'Thu hồi quyền' : 'Cấp quyền chỉnh sửa'}</button></td></tr>)}</tbody></table></div> : <p className="admin-empty-line">Khi có người đăng ký hoặc đăng nhập Google lần đầu, họ sẽ hiện tại đây.</p>}
    </section>
  </div>;
}
