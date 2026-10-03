import {database} from '@/db/store';
import {sanitizeBackgrounds} from '@/lib/site-backgrounds';

/** Only decorative image URLs are public, never private settings or customer records. */
export async function GET() {
  try {
    const row = await database().prepare("SELECT payload FROM records WHERE owner='admin' AND kind='settings' AND id='main'").first<{payload: string}>();
    return Response.json({backgrounds: sanitizeBackgrounds(row ? JSON.parse(row.payload).backgrounds : {})}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({error: 'Chưa tải được ảnh nền.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
