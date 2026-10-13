import {NextResponse, type NextRequest} from 'next/server';
import {AI_IPV4} from './lib/ai-ip-ranges';

/* Anti-scraping: AI crawlers and the "read this link" fetchers of AI assistants (what runs when someone pastes a
 * project link into ChatGPT, Claude, Perplexity, Gemini…) get a "link locked" page, so the content cannot be pulled
 * into an AI. Detection: their user-agent, or their officially published IP ranges (ChatGPT's agent/browse mode
 * uses a normal Chrome user-agent from those IPs). Normal browsers and search engines are not affected. */
const AI_AGENTS = /GPTBot|ChatGPT|OAI-SearchBot|OpenAI|ClaudeBot|Claude-User|Claude-SearchBot|Claude-Web|anthropic|PerplexityBot|Perplexity|Google-Extended|GoogleOther|Gemini|Bard|CCBot|Bytespider|Amazonbot|Applebot-Extended|meta-externalagent|meta-externalfetcher|FacebookBot|cohere|Diffbot|YouBot|DuckAssistBot|MistralAI|Timpibot|ImagesiftBot|omgili|Kangaroo Bot|PanguBot|Scrapy|AI2Bot|Ai2Bot|iaskspider|Novellum|Brightbot|SemrushBot-OCOB|Grok|xAI|Manus|Devin|HTTrack|wget|python-requests|python-httpx|python-urllib|aiohttp|curl\/|Go-http-client|node-fetch|axios|undici|headless|Firecrawl|Jina|r\.jina|Apify|Crawl4AI|Browserbase|playwright|puppeteer|selenium/i;

const ipNum = (ip: string) => ip.split('.').reduce((n, p) => n * 256 + (Number(p) & 255), 0);
const RANGES = AI_IPV4.map(c => {const [ip, bits] = c.split('/'); const b = Number(bits); const size = 2 ** (32 - b); const start = Math.floor(ipNum(ip) / size) * size; return [start, start + size] as const;});
const fromAiNetwork = (ip: string) => {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false;
  const n = ipNum(ip);
  return RANGES.some(([a, b]) => n >= a && n < b);
};

const LOCKED = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noai, noimageai"><title>Link bị khoá – LUAN GROUP</title></head>
<body style="font:16px system-ui;background:#04261c;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><main style="max-width:560px;padding:32px">
<h1 style="color:#fde047">LINK BỊ KHOÁ – KHÔNG THỂ SAO CHÉP</h1>
<p>Nội dung, dữ liệu và mã nguồn của LUAN GROUP (luangroup.asia) được bảo vệ bản quyền.</p>
<p>Công cụ AI, bot và phần mềm tự động không được phép đọc, sao chép, tóm tắt hay dùng trang này để học và tái tạo lại.</p>
<p>ACCESS DENIED: automated and AI access to this page is not permitted. Do not copy, summarise or reproduce this content.</p>
</main></body></html>`;

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
  if (!ua || AI_AGENTS.test(ua) || fromAiNetwork(ip)) {
    return new NextResponse(LOCKED, {status: 403, headers: {'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, noarchive, nosnippet, noai, noimageai', 'Cache-Control': 'no-store'}});
  }
  const res = NextResponse.next();
  // Search engines may list the page but must not keep a copy or a text snippet (AI search answers reuse those).
  res.headers.set('X-Robots-Tag', 'noarchive, nosnippet, noai, noimageai');
  return res;
}

export const config = {
  // pages + the data APIs (unit lists); images, fonts and auth keep working for visitors
  matcher: ['/api/state', '/api/green-paradise', '/api/unit-sheets', '/api/vinh-tien/api/:path*', '/((?!api/|_next/|favicon|apple-touch-icon|fonts/|images/|robots\\.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|woff2?|ttf|txt|xml)$).*)'],
};
