const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
function isLoopback(value) {
  try { return LOOPBACK.has(new URL(value).hostname); } catch { return false; }
}

// Dev-server only: never bundled into the browser or used by the Render server.
export function createDevApiProxy(configuredTarget) {
  const target = new URL(configuredTarget || 'http://127.0.0.1:5001');
  if (target.username || target.password || target.search || target.hash || target.pathname !== '/'
    || !['http:', 'https:'].includes(target.protocol)
    || (target.protocol === 'http:' && !LOOPBACK.has(target.hostname))) {
    throw new Error('THREADLABS_DEV_API_TARGET must be an HTTPS origin or a loopback HTTP origin, without credentials or a path.');
  }
  return {
    target: target.origin,
    changeOrigin: true,
    cookieDomainRewrite: '',
    configure(proxy) {
      proxy.on('proxyReq', (upstream, req) => {
        // Preserve production CSRF/origin validation. Only this loopback browser's
        // origin is translated to the explicitly selected backend's own origin.
        if (isLoopback(`http://${req.headers.host}`) && isLoopback(req.headers.origin)) upstream.setHeader('Origin', target.origin);
      });
      proxy.on('proxyRes', (upstream, req) => {
        // Production cookies stay Secure at Render. A loopback HTTP dev browser
        // needs its own host-only cookie to survive refresh/logout consistently.
        if (!req.socket.encrypted && isLoopback(`http://${req.headers.host}`) && upstream.headers['set-cookie']) {
          upstream.headers['set-cookie'] = upstream.headers['set-cookie'].map(cookie => cookie.replace(/;\s*Secure(?=;|$)/gi, ''));
        }
      });
      proxy.prependListener('error', (_error, _req, res) => {
        if (res.headersSent || res.writableEnded) return;
        res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ code: 'API_UNAVAILABLE', error: 'The ThreadLabs API is unavailable. Start the backend or configure THREADLABS_DEV_API_TARGET for this development server.' }));
      });
    },
  };
}
