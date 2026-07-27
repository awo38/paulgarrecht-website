import RobotArmViewer from './RobotArmViewer.jsx';

// Standalone preview shell for local development only (npm run dev).
// The actual deliverable is RobotArmViewer.jsx / mount-embed.jsx.
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RobotArmViewer />
    </div>
  );
}
