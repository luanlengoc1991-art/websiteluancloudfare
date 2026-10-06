import {isSameOrigin} from '@/lib/request-origin';
import {getSignedInUser} from '@/lib/auth';
import {mediaLimit, mediaFailure, storeMedia, replaceMedia} from '@/lib/media-storage';

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return Response.json({error: 'Yêu cầu không hợp lệ.'}, {status: 403});
    const user = await getSignedInUser();
    if (!user) return Response.json({error: 'Vui lòng đăng nhập.'}, {status: 401});
    if (!user.canEdit) return Response.json({error: 'Tài khoản chưa được cấp quyền tải ảnh.'}, {status: 403});
    if (Number(req.headers.get('content-length') || 0) > mediaLimit + 256 * 1024) return Response.json({error: 'Tối đa 10 MB mỗi file.'}, {status: 413});
    const form = await req.formData(), file = form.get('file');
    if (!(file instanceof File)) return Response.json({error: 'Vui lòng chọn file.'}, {status: 400});
    const replaceId = String(form.get('replaceId') || '');
    const saved = replaceId ? await replaceMedia(file, replaceId, user.isAdmin) : await storeMedia(file, String(form.get('projectId') || ''), String(form.get('kind') || ''), user.isAdmin);
    return Response.json({ok: true, ...saved}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) { return mediaFailure(error); }
}
