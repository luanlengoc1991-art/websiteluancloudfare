'use client';

import {useEffect, useState} from 'react';
import {Bot, CheckCircle2, CircleAlert, Loader2, Send} from 'lucide-react';

type ClaudeStatus = {
  configured: boolean;
  model: string;
};

export default function AdminClaude() {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [prompt, setPrompt] = useState(
    'Kiểm tra kết nối giúp tôi. Hãy xác nhận bạn có thể nhận yêu cầu kỹ thuật cho website này.'
  );
  const [answer, setAnswer] = useState('');
  const [usage, setUsage] = useState<{inputTokens: number | null; outputTokens: number | null} | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/claude', {cache: 'no-store'})
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không kiểm tra được Claude API.');
        if (active) {
          setStatus({configured: Boolean(data.configured), model: String(data.model || '')});
          setStatusError('');
        }
      })
      .catch(error => {
        if (active) setStatusError(error instanceof Error ? error.message : 'Không kiểm tra được Claude API.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function runTest(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setAnswer('');
    setUsage(null);
    try {
      const response = await fetch('/api/admin/claude', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: prompt.trim()})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Claude API trả về lỗi.');
      setAnswer(String(data.text || ''));
      setUsage(data.usage || null);
      setStatus(current => (current ? {...current, configured: true, model: data.model || current.model} : current));
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'Không chạy được phép thử.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-form">
      <div className="settings-card">
        <h2><Bot size={20}/> AI sửa website · Bản thử Claude API</h2>
        <p className="muted">
          Mục này chỉ kiểm tra kết nối Claude từ server. API key không được gửi xuống trình duyệt.
        </p>
        {statusError ? (
          <p role="alert"><CircleAlert size={16}/> {statusError}</p>
        ) : !status ? (
          <p className="muted"><Loader2 size={16}/> Đang kiểm tra cấu hình…</p>
        ) : status.configured ? (
          <p><CheckCircle2 size={16}/> Đã nhận ANTHROPIC_API_KEY · model {status.model}</p>
        ) : (
          <p><CircleAlert size={16}/> Chưa có ANTHROPIC_API_KEY trong Cloudflare Worker Secret.</p>
        )}
      </div>

      <form className="settings-card" onSubmit={runTest}>
        <h2>Gửi thử một yêu cầu</h2>
        <p className="muted">
          Claude sẽ phân tích và phản hồi. Bản thử này chưa được cấp quyền GitHub nên chưa tự commit/push code.
        </p>
        <label className="field">
          <span>Yêu cầu</span>
          <textarea
            rows={7}
            maxLength={4000}
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            placeholder="Ví dụ: phân tích cách làm phần tìm kiếm quỹ căn nổi bật hơn..."
          />
        </label>
        <button className="button dark" type="submit" disabled={busy || !prompt.trim()}>
          {busy ? <Loader2 size={17}/> : <Send size={17}/>}
          {busy ? 'Đang gọi Claude…' : 'Thử Claude API'}
        </button>
      </form>

      {answer && (
        <div className="settings-card">
          <h2>Phản hồi từ Claude</h2>
          <p style={{whiteSpace: 'pre-wrap'}}>{answer}</p>
          {usage && (
            <p className="small muted">
              Token: input {usage.inputTokens ?? '—'} · output {usage.outputTokens ?? '—'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
