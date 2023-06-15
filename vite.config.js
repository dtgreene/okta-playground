import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react';
import dns from 'dns';

// Prefer 'localhost' to '127.0.0.1':
dns.setDefaultResultOrder('verbatim');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  Object.assign(process.env, env, '');

  return {
    build: {
      outDir: 'build',
      sourcemap: true,
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    plugins: [reactRefresh()],
    resolve: {
      alias: {
        'app': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
