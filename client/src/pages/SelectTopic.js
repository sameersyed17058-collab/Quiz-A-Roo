import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_TOPICS = [
  { title: 'Science & Nature', description: 'Explore the wonders of the universe, biology, physics, and ecology.', icon: 'science', color: '#10b981' },
  { title: 'History', description: 'Journey through ancient empires, revolutions, and legendary eras.', icon: 'history_edu', color: '#d97706' },
  { title: 'Pop Culture', description: 'Blockbuster movies, top charts music, celebrities, and gaming.', icon: 'movie', color: '#ec4899' },
  { title: 'Geography', description: 'World capitals, landscapes, oceans, mountain peaks, and maps.', icon: 'public', color: '#0284c7' },
  { title: 'Sports', description: 'Championships, Olympic records, legends, and team trivia.', icon: 'sports_soccer', color: '#ea580c' },
  { title: 'Technology', description: 'Artificial Intelligence, coding, future gadgets, and tech titans.', icon: 'computer', color: '#8b5cf6' }
];

export default function SelectTopic() {
  const nav = useNavigate();
  const loc = useLocation();
  const [selected, setSelected] = useState(DEFAULT_TOPICS[0].title);
  const [custom, setCustom] = useState('');
  const playerName = (loc.state?.playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  if (!playerName) {
    return (
      <div className="panel-shell empty-state">
        <h2>Please enter your player name first.</h2>
        <button className="primary-btn" onClick={() => nav('/')}>Back to Home</button>
      </div>
    );
  }

  const handleContinue = () => {
    const topic = (custom.trim() || selected).trim();
    if (!topic) {
      alert('Please select a topic or type one in manually.');
      return;
    }
    nav('/select-difficulty', { state: { topic, playerName } });
  };

  const handlePick = (title) => {
    setSelected(title);
    nav('/select-difficulty', { state: { topic: title, playerName } });
  };

  return (
    <div className="panel-shell select-topic-shell">
      <div className="section-header">
        <div>
          <div className="eyebrow-badge">
            Explorer: {playerName}
          </div>
          <h1>Choose Your Trivia Subject</h1>
          <p className="subtitle">Pick a featured category below or type any custom topic to generate custom AI questions!</p>
        </div>
      </div>

      <div className="topic-grid">
        {DEFAULT_TOPICS.map((topic) => (
          <button
            key={topic.title}
            type="button"
            className={`topic-card ${selected === topic.title ? 'selected' : ''}`}
            onClick={() => handlePick(topic.title)}
          >
            <div className="topic-icon-wrap" style={{ color: topic.color, background: `${topic.color}18` }}>
              <span className="material-symbols-outlined">{topic.icon}</span>
            </div>
            <div className="topic-content">
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
            <span className="material-symbols-outlined arrow">arrow_forward</span>
          </button>
        ))}
      </div>

      <div className="custom-topic-panel">
        <div className="custom-topic-header">
          <span className="material-symbols-outlined custom-icon">edit_note</span>
          <div>
            <h3>Want a Custom Subject?</h3>
            <p>Type any topic you can imagine (e.g. "Marvel Cinematic Universe", "Quantum Mechanics", "World War II")</p>
          </div>
        </div>
        <div className="custom-input-row">
          <input
            className="topic-input"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="Type any custom topic here..."
          />
          <button className="primary-btn custom-next-btn" onClick={handleContinue}>
            Next Step ➡️
          </button>
        </div>
      </div>
    </div>
  );
}
