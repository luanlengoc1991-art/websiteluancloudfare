import {getCurrentUser} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';

export const runtime = 'nodejs';

const MODEL = 'claude-sonnet-5-5';

function hasClaudeKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) {
    return Response.json(
      {error: 'Chỉ tài khoản quản trị được kiểm tra Claude API.'},
      {status: 401, headers: {'Cache-Control': 'no-store'}}
    );
  }

  return Response.json(
    {configured: hasClaudeKey(), model: MODEL},
    {headers: {'Cache-Control': 'no-store'}}
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({error: 'Yêu cầu không hợp lệ.'}, {status: 403});
  }

  const admin = await getCurrentUser();
  if (!admin) {
    return Response.json({error: 'Chỉ tài khoản quản trị được dùng Claude API.'}, {status: 401});
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {error: 'Chưa cấu hình ANTHROPIC_API_KEY trong Cloudflare Worker Secret.'},
      {status: 503}
    );
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) {
    return Response.json(
      {error: 'Nội dung thử nghiệm phải từ 1 đến 4.000 ký tự.'},
      {status: 400}
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system:
          'Bạn là trợ lý kỹ thuật cho website Alpha HUB. Đây là chế độ thử kết nối Claude API. Hãy trả lời bằng tiếng Việt, ngắn gọn, chính xác. Bạn chưa được cấp công cụ GitHub trong endpoint này, vì vậy không được tuyên bố rằng đã sửa, commit, push hoặc deploy website.',
        messages: [{role: 'user', content: prompt}]
      }),
      signal: controller.signal
    });

    const payload: any = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error?.message || 'Claude API trả về lỗi.';
      return Response.json(
        {error: message},
        {status: response.status >= 500 ? 502 : 400, headers: {'Cache-Control': 'no-store'}}
      );
    }

    const text = Array.isArray(payload?.content)
      ? payload.content
          .filter((block: any) => block?.type === 'text' && typeof block.text === 'string')
          .map((block: any) => block.text)
          .join('\n')
          .trim()
      : '';

    return Response.json(
      {
        ok: true,
        model: payload?.model || MODEL,
        text: text || 'Claude đã phản hồi nhưng không có khối văn bản.',
        usage: payload?.usage
          ? {
              inputTokens: payload.usage.input_tokens ?? null,
              outputTokens: payload.usage.output_tokens ?? null
            }
          : null
      },
      {headers: {'Cache-Control': 'no-store'}}
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return Response.json(
      {error: timedOut ? 'Claude API phản hồi quá thời gian.' : 'Không kết nối được Claude API.'},
      {status: timedOut ? 504 : 502}
    );
  } finally {
    clearTimeout(timeout);
  }
}
