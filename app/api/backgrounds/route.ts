import {database} from '@/db/store';
import {sanitizeBackgrounds, sanitizeBackgroundAppearances} from '@/lib/site-backgrounds';

/** Only decorative background settings are public, never private settings or customer records. */
export async function GET() {
  try {
    const row = await database().prepare("SELECT payload FROM records WHERE owner='admin' AND kind='settings' AND id='main'").first<{payload: string}>();
    const settings = row ? JSON.parse(row.payload) : {};
    return Response.json({backgrounds: sanitizeBackgrounds(settings.backgrounds), backgroundAppearance: sanitizeBackgroundAppearances(settings.backgroundAppearance)}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({error: 'Chưa tải được ảnh nền.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
