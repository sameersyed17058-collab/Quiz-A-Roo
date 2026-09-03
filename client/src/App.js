import React, { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Roadmap from './pages/Roadmap';
import SelectTopic from './pages/SelectTopic';
import SelectDifficulty from './pages/SelectDifficulty';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';

export default function App() {
  const [playerName, setPlayerName] = useState(localStorage.getItem('quizaroo-player-name') || '');
  const [secretId, setSecretId] = useState(localStorage.getItem('quizaroo-secret-id') || '');
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('quizaroo-player-name') || '';
    const storedSecret = localStorage.getItem('quizaroo-secret-id') || '';
    setPlayerName(storedName);
    setSecretId(storedSecret);
  }, [location]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand-link">
          <div className="brand">
            <span className="brand-icon">🦘</span> Quiz-A-Roo
          </div>
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink className="nav-link" to="/">Home</NavLink>
          <NavLink className="nav-link" to="/roadmap">🗺️ Roadmap</NavLink>
          <NavLink className="nav-link" to="/select-topic">Categories</NavLink>
          <NavLink className="nav-link" to="/history">📜 History</NavLink>
          <NavLink className="nav-link" to="/leaderboard">🏆 Leaderboard</NavLink>
        </nav>

        {playerName && secretId ? (
          <div className="topbar-user-badge" onClick={() => nav('/')} title="Click to view/manage your private Explorer Profile">
            <span className="user-icon">👤</span>
            <span className="user-name">{playerName}</span>
            <span className="topbar-id-pill" title="Private Explorer Key active">🔒 Key Active</span>
          </div>
        ) : (
          <NavLink to="/" className="topbar-login-link">
            🔑 Login / Register
          </NavLink>
        )}
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/select-topic" element={<SelectTopic />} />
          <Route path="/select-difficulty" element={<SelectDifficulty />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </main>
    </div>
  );
}
