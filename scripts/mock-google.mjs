import {createHash} from 'node:crypto';
import {createServer} from 'node:http';

/**
 * Disposable stand-in for Google's OAuth endpoints, used by npm test only.
 * It mints unsigned id_tokens; the Worker trusts the token endpoint response
 * because in production that response comes from Google over TLS.
 */
export async function mockGoogle(clientId) {
  const codes = new Map();
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const send = (status, body) => {
      response.writeHead(status, {'Content-Type': 'application/json'});
      response.end(JSON.stringify(body));
    };
    if (url.pathname === '/token' && request.method === 'POST') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const form = new URLSearchParams(Buffer.concat(chunks).toString());
      const issued = codes.get(form.get('code'));
      codes.delete(form.get('code'));
      if (!issued || form.get('client_id') !== clientId) return send(400, {error: 'invalid_grant'});
      if (createHash('sha256').update(form.get('code_verifier') || '').digest('base64url') !== issued.challenge) return send(400, {error: 'invalid_grant'});
      const claims = {iss: 'https://accounts.google.com', aud: clientId, exp: Math.floor(Date.now() / 1000) + 600, ...issued.claims};
      return send(200, {id_token: `${encode({alg: 'RS256'})}.${encode(claims)}.signature`});
    }
    send(404, {error: 'not_found'});
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    /** Make one authorization code redeemable once, for the given PKCE verifier. */
    issueCode(code, verifier, claims) {
      codes.set(code, {challenge: createHash('sha256').update(verifier).digest('base64url'), claims});
    },
    close: () => new Promise((resolve) => server.close(resolve))
  };
}
