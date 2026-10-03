import { preview } from 'vite';

// Single owned Node process: no npx/npm parent left waiting on a child server.
const server = await preview({ mode: 'development', preview: {
  host: '127.0.0.1', port: 4173, strictPort: true
} });
let closing = false;
const close = () => {
  if (closing) return;
  closing = true;
  const deadline = setTimeout(() => process.exit(1), 4000);
  server.httpServer.closeAllConnections();
  server.httpServer.close(() => { clearTimeout(deadline); process.exit(0); });
};
process.once('SIGTERM', close);
process.once('SIGINT', close);
server.printUrls();
