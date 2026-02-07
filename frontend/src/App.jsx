import { userService } from '@/services/userService';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MatchSetup from './components/MatchSetup/MatchSetup';
import GameScreen from './components/GameScreen/GameScreen';
import HallOfFame from './components/HallOfFame';
import PlayerManagement from './components/PlayerManagement';
import Navbar from './components/Navbar';
import { BadgeAlert } from 'lucide-react';

function App() {
  const [backendStatus, setBackendStatus] = useState("checking");

  // Poll backend
  useEffect(() => {
    const check = async () => {
      try {
        const isOnline = await userService.checkHealth();
        setBackendStatus(isOnline ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
        {/* Backend Status Indicator */}
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          {backendStatus === 'offline' && (
            <div className="flex items-center gap-2 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium border border-red-400 shadow-sm backdrop-blur-sm">
              <BadgeAlert className="w-4 h-4" />
              Backend Offline
            </div>
          )}
        </div>

        <Navbar />

        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/players" element={<PlayerManagement />} />
            <Route path="/setup" element={<MatchSetup />} />
            <Route path="/game/:id" element={<GameScreen />} />
        </Routes>
    </Router>
  );
}

export default App;
