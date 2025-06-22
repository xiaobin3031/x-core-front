import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd())
//   return {
//     plugins: [react()],
//     server: {
//       target: 'http://127.0.0.1:6547'
//     }
//   }
// })
