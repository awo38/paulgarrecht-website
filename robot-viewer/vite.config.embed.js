import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production embed build: bundles React + R3F + drei + the component into a single
// self-mounting IIFE script, so it can be dropped into the static (non-React) main
// site via a plain <script> tag. Output goes to dist-embed/, then gets copied into
// vendor/robot-viewer/ in the parent repo.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/mount-embed.jsx',
      name: 'RobotArmViewerEmbed',
      formats: ['iife'],
      fileName: () => 'robot-viewer.js',
    },
  },
});
