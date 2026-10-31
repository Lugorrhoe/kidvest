import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import About from './pages/About';
import Home from './pages/Home';
import Play from './pages/Play';
import Parent from './pages/Parent';

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/play/:profileId" element={<Play />} />
        <Route path="/parent/*" element={<Parent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
