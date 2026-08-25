import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const target = mode === 'development' ? 'local' : mode;

  return {
  base: './',
  build: {
    outDir: `dist/${target}`,
    emptyOutDir: true,
    sourcemap: target === 'local'
  },
  define: {
    __BUILD_TARGET__: JSON.stringify(target)
  },
  server: {
    host: true
  }
  };
});
