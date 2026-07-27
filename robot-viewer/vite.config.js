import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server + demo build (src/App.jsx renders RobotArmViewer full-page for local preview).
export default defineConfig({
  plugins: [react()],
});
