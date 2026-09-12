import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    process.env.SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
    process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), {
        name: 'local-vercel-api',
        configureServer(server) {
        // Vercel's serverless functions live under api/*.ts and are each an
        // independent handler. Locally, Vite doesn't know about them at all,
        // so this middleware maps any /api/<name> request to api/<name>.ts
        // and invokes its default export the same way Vercel would.
        server.middlewares.use('/api', async (req, res, next) => {
          const url = new URL(req.url || '', 'http://localhost');
          const routeName = url.pathname.replace(/^\//, '').split('/')[0];
          if (!routeName || !/^[a-z0-9-]+$/i.test(routeName)) {
            next();
            return;
          }

          let handler;
          try {
            const module = await import(`./api/${routeName}.ts`);
            handler = module.default;
          } catch {
            next();
            return;
          }

          let rawBody = '';
          req.setEncoding('utf8');
          req.on('data', (chunk) => { rawBody += chunk; });
          req.on('end', async () => {
            try {
              (req as typeof req & { body?: unknown }).body = rawBody ? JSON.parse(rawBody) : {};
              const response = res as typeof res & {
                status: (code: number) => typeof res;
                json: (body: unknown) => void;
              };
              response.status = (code) => {
                res.statusCode = code;
                return res;
              };
              response.json = (body) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
              };
              await handler(req as never, response as never);
            } catch (error) {
              next(error as Error);
            }
          });
        });
        },
      }],
      define: {
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        'process.env.GOOGLE_PLACE_ID': JSON.stringify(env.GOOGLE_PLACE_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
