/** Decorative backgrounds only; AlphaHub and project experiences keep their own photos. */
export const backgroundPages = [
  ['default', 'Nền chung'],
  ['trang-chu', 'Trang chủ'],
  ['du-an', 'Dự án'],
  ['quy-hang', 'Quỹ căn'],
  ['tin-tuc', 'Tin tức'],
  ['gioi-thieu', 'Giới thiệu'],
  ['huong-dan', 'Hướng dẫn'],
  ['lien-he', 'Liên hệ'],
  ['yeu-thich', 'Yêu thích'],
  ['auth', 'Đăng nhập / Đăng ký'],
  ['tai-khoan', 'Tài khoản'],
  ['admin', 'Quản trị'],
  ['editor', 'Trình chỉnh sửa'],
] as const;

export type BackgroundPage = typeof backgroundPages[number][0];
export type SiteBackgrounds = Partial<Record<BackgroundPage, string>>;
export type BackgroundAppearance = {imageOpacity?: number; overlayOpacity?: number; gradientStart?: string; gradientEnd?: string};
export type BackgroundAppearances = Partial<Record<BackgroundPage, BackgroundAppearance>>;
export const defaultBackgroundAppearance = {imageOpacity: .65, overlayOpacity: 117 / 255};
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

function backgroundPage(pathname: string): BackgroundPage | undefined {
  const segment = pathname.split('/')[1] || 'trang-chu';
  const key = ['dang-nhap', 'dang-ky', 'auth'].includes(segment) ? 'auth' : segment === 'vinh-tien-editor' ? 'editor' : segment;
  return backgroundPages.find(([id]) => id === key)?.[0];
}

export function resolveBackgroundImage(pathname: string, backgrounds: SiteBackgrounds): string {
  const page = backgroundPage(pathname);
  return (page && backgrounds[page]) || backgrounds.default || defaultBackgroundImage;
}

export function sanitizeBackgroundAppearances(value: unknown): BackgroundAppearances {
  if (!value || typeof value !== 'object') return {};
  const result: BackgroundAppearances = {};
  for (const [page] of backgroundPages) {
    const appearance = (value as Record<string, unknown>)[page];
    if (!appearance || typeof appearance !== 'object') continue;
    const input = appearance as Record<string, unknown>;
    const output: BackgroundAppearance = {};
    for (const key of ['imageOpacity', 'overlayOpacity'] as const) {
      const opacity = input[key];
      if (typeof opacity === 'number' && Number.isFinite(opacity) && opacity >= 0 && opacity <= 1) output[key] = opacity;
    }
    for (const key of ['gradientStart', 'gradientEnd'] as const) {
      const color = input[key];
      if (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)) output[key] = color;
    }
    result[page] = output;
  }
  return result;
}

export function resolveBackgroundAppearance(pathname: string, appearances: BackgroundAppearances): BackgroundAppearance {
  const page = backgroundPage(pathname);
  return {...defaultBackgroundAppearance, ...appearances.default, ...(page ? appearances[page] : {})};
}

/** Shared by the live background and its settings preview; no foreground styles change. */
export function backgroundLayers(appearance: BackgroundAppearance) {
  const imageOpacity = appearance.imageOpacity ?? defaultBackgroundAppearance.imageOpacity;
  const opacity = appearance.overlayOpacity ?? defaultBackgroundAppearance.overlayOpacity;
  const glow = opacity * 46 / 117;
  const rgba = (hex: string) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${opacity})`;
  if (appearance.gradientStart || appearance.gradientEnd) {
    const start = appearance.gradientStart || '#004f3e', end = appearance.gradientEnd || '#00231d';
    return {imageOpacity, canvas: `linear-gradient(180deg,${start},${end})`, overlay: `linear-gradient(180deg,${rgba(start)},${rgba(end)})`};
  }
  return {
    imageOpacity,
    canvas: 'linear-gradient(180deg,#004f3e 0%,#00765a 15%,#008a69 32%,#008266 50%,#005d4b 70%,#00231d 100%)',
    overlay: `radial-gradient(ellipse 90% 65% at 0% 28%,rgba(0,161,156,${glow}) 0%,#00a19c00 74%),radial-gradient(ellipse 90% 65% at 100% 25%,rgba(0,141,71,${glow}) 0%,#008d4700 74%),linear-gradient(180deg,${rgba('#004f3e')} 0%,${rgba('#00765a')} 15%,${rgba('#008a69')} 32%,${rgba('#008266')} 50%,${rgba('#005d4b')} 70%,${rgba('#00231d')} 100%)`,
  };
}
