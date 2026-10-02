import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const target = mode === 'development' ? 'local' : mode;

  return {
    base: './',
    build: {
      target: 'es2018',
      outDir: `dist/${target}`,
      emptyOutDir: true,
      sourcemap: target === 'local'
    },
    define: {
      __BUILD_TARGET__: JSON.stringify(target)
    },
    server: {
      host: true,
      watch: {
        // All platform outputs must be excluded, not only the active outDir.
        // Rebuilding another target must not reload the game or watch generated files.
        ignored: [
          '**/dist/**',
          '**/coverage/**',
          '**/playwright-report/**',
          '**/test-results/**',
          '**/.tmp/**',
          '**/tmp/**',
          '**/.kilo/**'
        ]
      }
    }
  };
});
