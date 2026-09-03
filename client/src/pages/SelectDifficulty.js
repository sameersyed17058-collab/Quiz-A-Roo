import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Easy Outback',
    xp: '100 XP / Question',
    multiplier: '1x Multiplier',
    icon: 'sentiment_satisfied',
    tone: 'easy',
    desc: 'Fun and accessible questions to warm up your trivia instincts.',
    color: '#10b981'
  },
  {
    id: 'medium',
    label: 'Medium Explorer',
    xp: '150 XP / Question',
    multiplier: '1.5x Multiplier',
    icon: 'psychology',
    tone: 'medium',
    desc: 'Balanced challenge testing practical knowledge and deeper facts.',
    color: '#f59e0b'
  },
  {
    id: 'hard',
    label: 'Hard Master',
    xp: '200 XP / Question',
    multiplier: '2x Multiplier',
    icon: 'bolt',
    tone: 'hard',
    desc: 'Tough, advanced questions designed for true masters with maximum XP rewards.',
    color: '#ef4444'
  }
];

export default function SelectDifficulty() {
  const loc = useLocation();
  const { topic, playerName } = loc.state || {};
  const [difficulty, setDifficulty] = useState('medium');
  const nav = useNavigate();
  const currentPlayer = (playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  if (!topic) {
    return (
      <div className="panel-shell empty-state">
        <h2>Topic not selected</h2>
        <button className="primary-btn" onClick={() => nav('/select-topic')}>Choose a topic</button>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="panel-shell empty-state">
        <h2>Please enter your player name first.</h2>
        <button className="primary-btn" onClick={() => nav('/')}>Back to Home</button>
      </div>
    );
  }

  const next = () => nav('/quiz', { state: { topic, difficulty, playerName: currentPlayer } });

  return (
    <div className="panel-shell select-difficulty-shell">
      <div className="section-header compact">
        <div>
          <div className="eyebrow-badge">
            Subject: {topic}
          </div>
          <h1>Choose Your Challenge Level</h1>
          <p className="subtitle">Higher difficulty unlocks greater XP rewards on the global leaderboard!</p>
        </div>
      </div>

      <div className="difficulty-grid">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`difficulty-card ${difficulty === item.id ? 'selected' : ''} ${item.tone}`}
            onClick={() => setDifficulty(item.id)}
          >
            <div className="difficulty-topline">
              <div className={`difficulty-icon-wrap ${item.tone}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className={`diff-xp-tag ${item.tone}`}>{item.multiplier}</span>
            </div>

            <div className="difficulty-body">
              <h3>{item.label}</h3>
              <p>{item.desc}</p>
              <div className="diff-reward-pill">
                🪙 {item.xp}
              </div>
            </div>

            <div className="diff-select-indicator">
              {difficulty === item.id ? '✓ Selected' : 'Tap to Select'}
            </div>
          </button>
        ))}
      </div>

      <div className="action-row align-between diff-action-bar">
        <button className="secondary-btn" onClick={() => nav('/select-topic')}>
          ← Back to Topics
        </button>
        <button className="primary-btn pulse-glow-btn" onClick={next}>
          Launch Quiz ({difficulty.toUpperCase()}) 🚀
        </button>
      </div>
    </div>
  );
}
