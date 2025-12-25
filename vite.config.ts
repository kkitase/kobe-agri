import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // loadEnv: ローカルの.envファイルから読み込み
  const env = loadEnv(mode, '.', '');
  // Vercel等のデプロイ環境では process.env から直接取得
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
