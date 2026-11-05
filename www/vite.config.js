import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'production-scene-entry',
    apply: 'build',
    enforce: 'post',
    // Import maps are useful for the unbundled page; production includes its dependencies.
    transformIndexHtml(html) {
      return html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['div.html'];
        if (entry) {
          delete bundle['div.html'];
          entry.fileName = 'index.html';
          bundle['index.html'] = entry;
        }
      }
    }
  }],
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL('./div.html', import.meta.url)),
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/pyramid.js'
      }
    }
  },
  server: {
    watch: {
      // Native Windows watchers can fail with EBUSY while assets are downloaded.
      usePolling: true,
      interval: 300
    }
  }
});
