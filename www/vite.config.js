import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Native Windows watchers can fail with EBUSY while assets are downloaded.
      usePolling: true,
      interval: 300
    }
  }
});
