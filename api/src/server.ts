export type ServerConfig = { version?: string };

export async function handle(
  req: Request,
  config: ServerConfig,
): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === '/api/health') {
    return Response.json({ ok: true, version: config.version ?? 'dev' });
  }
  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  const config: ServerConfig = { version: process.env.BUILD_SHA };
  Bun.serve({
    port: 3000,
    hostname: '127.0.0.1',
    fetch: (req) => handle(req, config),
  });
}
