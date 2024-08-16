import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ 
  plugins: [react()],
  base:"./",
  // publicDir:"public",
  resolve: {
    alias: {
      '@/': `${__dirname}/src/`,
      // '~/': `${__dirname}/public/`
    },
  },
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/scripts/[name].min.js',
        chunkFileNames: 'assets/scripts/[name].min.js',
        assetFileNames: (assetFile) => {
          if(/\.css$/.test(assetFile.name)) {
            return 'assets/styles/[name].min.[ext]';
          } else if(/\.( gif|jpeg|jpg|png|svg|webp| )$/.test(assetFile.name)) {
            return 'assets/images/[name].min.[ext]';
          } else if(/\.( ttf|otf|eot|woff|woff2| )$/.test(assetFile.name)) {
            return 'assets/fonts/[name].[ext]';
          } else {
            return 'assets/[name].[ext]';
          }
        } 
      }
    }
  }
})