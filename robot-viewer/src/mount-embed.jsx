import React from 'react';
import ReactDOM from 'react-dom/client';
import RobotArmViewer from './RobotArmViewer.jsx';

function mount() {
  const el = document.getElementById('robot-arm-root');
  if (!el) return;
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <RobotArmViewer />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
