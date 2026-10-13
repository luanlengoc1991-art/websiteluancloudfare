import {NextResponse, type NextRequest} from 'next/server';

/* Anti-scraping: AI crawlers and the "read this link" fetchers of AI assistants (what runs when someone pastes a
 * project link into ChatGPT, Claude, Perplexity, Gemini…) get 403, so the page content cannot be pulled into an AI.
 * Normal browsers and search engines (Googlebot, Bingbot, Zalo/Facebook link previews) are not affected. */
const AI_AGENTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ChatGPT|ClaudeBot|Claude-User|Claude-SearchBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|GoogleOther|Gemini|Bard|CCBot|Bytespider|Amazonbot|Applebot-Extended|meta-externalagent|meta-externalfetcher|FacebookBot|cohere-ai|cohere-training|Diffbot|YouBot|DuckAssistBot|MistralAI|Timpibot|ImagesiftBot|omgili|Kangaroo Bot|PanguBot|Scrapy|AI2Bot|Ai2Bot-Dolma|iaskspider|Novellum|Brightbot|SemrushBot-OCOB|HTTrack|wget|python-requests|python-httpx|aiohttp|curl\/|Go-http-client|node-fetch|axios|headless/i;

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || AI_AGENTS.test(ua)) {
    return new NextResponse('Nội dung được bảo vệ – LUAN GROUP.', {status: 403, headers: {'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noai, noimageai', 'Cache-Control': 'no-store'}});
  }
  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noai, noimageai');
  return res;
}

export const config = {
  // pages only: APIs, images and static files keep working for the site itself
  matcher: ['/((?!api/|_next/|favicon|apple-touch-icon|fonts/|images/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|woff2?|ttf|txt|xml)$).*)'],
};
