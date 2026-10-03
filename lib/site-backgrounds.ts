/** Decorative backgrounds only; AlphaHub and project experiences keep their own photos. */
export const backgroundPages = [
  ['default', 'Nền chung'],
  ['du-an', 'Dự án'],
  ['quy-hang', 'Quỹ căn'],
  ['tin-tuc', 'Tin tức'],
  ['gioi-thieu', 'Giới thiệu'],
  ['huong-dan', 'Hướng dẫn'],
  ['yeu-thich', 'Yêu thích'],
  ['auth', 'Đăng nhập / Đăng ký'],
  ['tai-khoan', 'Tài khoản'],
  ['admin', 'Quản trị'],
  ['editor', 'Trình chỉnh sửa'],
] as const;

export type BackgroundPage = typeof backgroundPages[number][0];
export type SiteBackgrounds = Partial<Record<BackgroundPage, string>>;
export const defaultBackgroundImage = '/images/green-paradise.webp';

export function isBackgroundImage(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  if (value === '' || /^\/api\/files\/[\w-]+$/.test(value) || /^\/images\/[\w./-]+\.(webp|png|jpe?g)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

export function sanitizeBackgrounds(value: unknown): SiteBackgrounds {
  if (!value || typeof value !== 'object') return {};
  const images = value as Record<string, unknown>;
  return Object.fromEntries(backgroundPages.flatMap(([key]) => isBackgroundImage(images[key]) ? [[key, images[key]]] : []));
}

export function resolveBackgroundImage(pathname: string, backgrounds: SiteBackgrounds): string {
  const segment = pathname.split('/')[1] || 'quy-hang';
  const key = ['dang-nhap', 'dang-ky', 'auth'].includes(segment) ? 'auth' : segment === 'vinh-tien-editor' ? 'editor' : segment;
  const page = backgroundPages.find(([id]) => id === key)?.[0];
  return (page && backgrounds[page]) || backgrounds.default || defaultBackgroundImage;
}
