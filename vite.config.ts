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
        name: 'local-gemini-api',
        configureServer(server) {
        const handlerPromise = import('./api/gemini').then((module) => module.default);
        server.middlewares.use('/api/gemini', async (req, res, next) => {
          if (req.method !== 'POST') {
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
              const geminiHandler = await handlerPromise;
              await geminiHandler(req as never, response as never);
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
