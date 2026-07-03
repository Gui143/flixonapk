// Vite config (CommonJS para evitar conflito de "type" com o Electron)
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const legacy = require('@vitejs/plugin-legacy');

module.exports = defineConfig({
  plugins: [
    react(),
    // Transcompila para WebViews antigas (TV Box, Android antigo)
    legacy({
      targets: ['chrome >= 60', 'android >= 5', 'ie >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  // base relativa -> carrega corretamente via file:// no Electron e no WebView mobile
  base: './',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
