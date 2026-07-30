import React from 'react';
import ReactDOM from 'react-dom/client';
import PlanetsHero from './PlanetsHero.jsx';

function mount() {
  const el = document.getElementById('hero-scene-root');
  if (!el) return;

  // Below ~768px the hero text is a single full-width column with no clear
  // space for planets to float in without constantly sitting on top of it,
  // and prefers-reduced-motion visitors shouldn't get the bounce/migrate
  // animation at all — skip mounting the scene; index.html's CSS gives the
  // bullet markers a plain static dot instead (see .bullet-marker rules).
  const skip =
    window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skip) return;

  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <PlanetsHero />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
