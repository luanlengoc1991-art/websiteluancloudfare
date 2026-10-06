'use client';

import {useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';
import {backgroundPages, backgroundLayers, defaultBackgroundAppearance, defaultBackgroundImage, type BackgroundPage, type SiteBackgrounds, type BackgroundAppearance, type BackgroundAppearances} from '@/lib/site-backgrounds';
import type {Asset} from '@/lib/catalog';

export default function BackgroundSettings({backgrounds = {}, appearances = {}, files, busy, onChange, onAppearanceChange, onUploadingChange}: {
  backgrounds?: SiteBackgrounds; appearances?: BackgroundAppearances; files: Asset[]; busy: boolean;
  onChange: (page: BackgroundPage, image: string) => void; onUploadingChange: (uploading: boolean) => void;
  onAppearanceChange: (page: BackgroundPage, appearance: BackgroundAppearance | undefined) => void;
}) {
  const [page, setPage] = useState<BackgroundPage>('default');
  const [uploading, setUploading] = useState(false);
  const latestChange = useRef(onChange);
  useEffect(() => {latestChange.current = onChange;}, [onChange]);
  const value = backgrounds[page] || '';
  const preview = value || backgrounds.default || defaultBackgroundImage;
  const images = files.filter(file => !['document', 'archived'].includes(file.kind));
  const appearance = {...defaultBackgroundAppearance, ...appearances.default, ...appearances[page]};
  const layers = backgroundLayers(appearance);
  const changeAppearance = (key: keyof BackgroundAppearance, value: number | string) => onAppearanceChange(page, {...appearances[page], [key]: value});

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
    <p>Điều chỉnh nền chung hoặc riêng trang đang chọn. Các trang chưa chỉnh riêng sẽ dùng thiết lập nền chung.</p>
    <div className="form-grid">
      <label className="field"><span>Độ hiện ảnh nền: {Math.round(appearance.imageOpacity * 100)}%</span><input type="range" min={0} max={100} step={1} disabled={busy || uploading} value={Math.round(appearance.imageOpacity * 100)} onChange={event => changeAppearance('imageOpacity', Number(event.target.value) / 100)}/><small>Giảm để ảnh ẩn hơn, tăng để ảnh rõ hơn.</small></label>
      <label className="field"><span>Độ đậm lớp màu: {Math.round(appearance.overlayOpacity * 100)}%</span><input type="range" min={0} max={100} step={1} disabled={busy || uploading} value={Math.round(appearance.overlayOpacity * 100)} onChange={event => changeAppearance('overlayOpacity', Number(event.target.value) / 100)}/><small>Tăng để lớp màu phủ đậm hơn, giảm để thấy ảnh rõ hơn.</small></label>
      <label className="field"><span>Màu đầu gradient</span><input type="color" disabled={busy || uploading} value={appearance.gradientStart || '#004f3e'} onChange={event => changeAppearance('gradientStart', event.target.value)}/><small>{appearance.gradientStart || '#004f3e'}</small></label>
      <label className="field"><span>Màu cuối gradient</span><input type="color" disabled={busy || uploading} value={appearance.gradientEnd || '#00231d'} onChange={event => changeAppearance('gradientEnd', event.target.value)}/><small>{appearance.gradientEnd || '#00231d'}</small></label>
    </div>
    <p>Xem trước ảnh, màu và độ đậm. Nhấn Lưu cấu hình để áp dụng lên website.</p>
    <div className="site-atmosphere" aria-hidden="true" style={{position: 'relative', zIndex: 0, width: '100%', height: 220, borderRadius: 12, marginBlock: 16, backgroundImage: layers.canvas}}>
      <img className="site-atmosphere-photo" key={preview} src={preview} alt="" loading="lazy" style={{opacity: layers.imageOpacity}}/>
      <div className="site-atmosphere-base" style={{backgroundImage: layers.overlay}}/>
    </div>
    <button type="button" className="button subtle" disabled={busy || uploading || !value} onClick={() => onChange(page, '')}>Dùng nền mặc định</button>
    <button type="button" className="button subtle" disabled={busy || uploading || !appearances[page]} onClick={() => onAppearanceChange(page, undefined)}>Khôi phục độ đậm và màu mặc định</button>
  </div>;
}
