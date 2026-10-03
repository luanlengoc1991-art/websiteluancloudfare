'use client';

import {useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';
import {backgroundPages, defaultBackgroundImage, type BackgroundPage, type SiteBackgrounds} from '@/lib/site-backgrounds';
import type {Asset} from '@/lib/catalog';

export default function BackgroundSettings({backgrounds = {}, files, busy, onChange, onUploadingChange}: {
  backgrounds?: SiteBackgrounds; files: Asset[]; busy: boolean;
  onChange: (page: BackgroundPage, image: string) => void; onUploadingChange: (uploading: boolean) => void;
}) {
  const [page, setPage] = useState<BackgroundPage>('default');
  const [uploading, setUploading] = useState(false);
  const latestChange = useRef(onChange);
  useEffect(() => {latestChange.current = onChange;}, [onChange]);
  const value = backgrounds[page] || '';
  const preview = value || backgrounds.default || defaultBackgroundImage;
  const images = files.filter(file => file.kind !== 'document');

  async function upload(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error('Chọn ảnh JPG, PNG hoặc WEBP, tối đa 4 MB.'); return;
    }
    setUploading(true); onUploadingChange(true);
    try {
      const body = new FormData();
      body.set('projectId', 'site-backgrounds'); body.set('kind', 'background'); body.set('file', file);
      const response = await fetch('/api/upload', {method: 'POST', body});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không tải được ảnh nền.');
      latestChange.current(page, '/api/files/' + result.id);
      toast.success('Đã tải ảnh. Nhấn Lưu cấu hình để áp dụng.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được ảnh nền.');
    } finally {setUploading(false); onUploadingChange(false);}
  }

  return <div className="settings-card">
    <h2>Ảnh nền ẩn của các trang</h2>
    <p>Chọn nền chung hoặc ảnh riêng từng tab. AlphaHub và trang trải nghiệm dự án giữ ảnh riêng hiện có.</p>
    <div className="form-grid">
      <label className="field"><span>Trang cần đổi nền</span><select disabled={busy || uploading} value={page} onChange={event => setPage(event.target.value as BackgroundPage)}>{backgroundPages.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field"><span>Ảnh từ thư viện</span><select disabled={busy || uploading} value={images.some(image => image.url === value) ? value : ''} onChange={event => {if (event.target.value) onChange(page, event.target.value);}}><option value="">Chọn ảnh đã tải lên</option>{images.map(image => <option key={image.id} value={image.url}>{image.name}</option>)}</select></label>
      <label className="field"><span>Đường dẫn ảnh nền</span><input disabled={busy || uploading} maxLength={2000} value={value} placeholder="https://… hoặc /api/files/…" onChange={event => onChange(page, event.target.value)}/><small>Để trống để dùng nền chung; nền chung trống sẽ dùng ảnh mặc định.</small></label>
      <label className="field"><span>Tải ảnh nền từ máy</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={event => {const file = event.target.files?.[0]; event.target.value = ''; if (file) upload(file);}}/><small>{uploading ? 'Đang tải ảnh…' : 'JPG, PNG hoặc WEBP · Tối đa 4 MB. Nhấn Lưu cấu hình sau khi chọn ảnh.'}</small></label>
    </div>
    <img key={preview} src={preview} alt="Xem trước ảnh nền ẩn" loading="lazy" style={{width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginTop: 16}}/>
    <button type="button" className="button subtle" disabled={busy || uploading || !value} onClick={() => onChange(page, '')}>Dùng nền mặc định</button>
  </div>;
}
