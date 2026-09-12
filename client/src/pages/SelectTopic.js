import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_TOPICS = [
  { title: 'Technology', description: 'Programming languages, algorithms, AI, web dev, and computer science.', icon: 'computer', color: '#8b5cf6', isTech: true },
  { title: 'Science & Nature', description: 'Explore the universe, cellular biology, physics, and chemistry.', icon: 'science', color: '#10b981' },
  { title: 'History', description: 'Journey through ancient empires, revolutions, and world eras.', icon: 'history_edu', color: '#d97706' },
  { title: 'Pop Culture', description: 'Blockbuster movies, top charts music, celebrities, and gaming.', icon: 'movie', color: '#ec4899' },
  { title: 'Geography', description: 'World capitals, landscapes, oceans, mountain peaks, and maps.', icon: 'public', color: '#0284c7' },
  { title: 'Sports', description: 'Championships, cricket, football, Olympic records, and legends.', icon: 'sports_soccer', color: '#ea580c' }
];

const PROGRAMMING_KEYWORDS = [
  'python', 'javascript', 'js', 'react', 'java', 'c++', 'cpp', 'c#', 'csharp', 'sql', 'rust',
  'golang', 'go', 'php', 'ruby', 'swift', 'typescript', 'ts', 'html', 'css', 'coding', 'program',
  'algorithm', 'dsa', 'data structures', 'node', 'backend', 'frontend', 'database', 'git', 'linux'
];

export default function SelectTopic() {
  const nav = useNavigate();
  const loc = useLocation();
  const [selected, setSelected] = useState(DEFAULT_TOPICS[0].title);
  const [custom, setCustom] = useState('');
  const [quizMode, setQuizMode] = useState('code'); // 'code' | 'theoretical'
  const [quizFormat, setQuizFormat] = useState('mcq'); // 'mcq' | 'hangaroo'
  const playerName = (loc.state?.playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  if (!playerName) {
    return (
      <div className="panel-shell empty-state">
        <h2>Please enter your player name first.</h2>
        <button className="primary-btn" onClick={() => nav('/')}>Back to Home</button>
      </div>
    );
  }

  const activeTopic = (custom.trim() || selected).trim();
  const isTechOrProg =
    selected === 'Technology' ||
    PROGRAMMING_KEYWORDS.some(k => activeTopic.toLowerCase().includes(k)) ||
    custom.trim().length > 0;

  const handleContinue = () => {
    const topic = (custom.trim() || selected).trim();
    if (!topic) {
      alert('Please select a topic or enter a custom one.');
      return;
    }

    if (quizFormat === 'hangaroo') {
      nav('/hangaroo', { state: { topic, playerName, quizMode } });
    } else {
      nav('/select-difficulty', { state: { topic, playerName, quizMode, quizFormat } });
    }
  };

  const handlePick = (title) => {
    setSelected(title);
    setCustom('');
  };

  return (
    <div className="panel-shell select-topic-shell">
      <div className="section-header compact">
        <div>
          <div className="eyebrow-badge">
            Explorer: {playerName}
          </div>
          <h1>Choose Your Trivia Subject</h1>
          <p className="subtitle">Pick a featured category or enter any custom topic (e.g. Python, AI, React) with custom focus!</p>
        </div>

        <button
          className="exam-prep-shortcut-btn"
          onClick={() => nav('/exam-prep', { state: { playerName } })}
          title="Prepare for University Exams by uploading your syllabus or lab manual"
        >
          📄 Exam Prep & Doc Upload 🎓
        </button>
      </div>

      <div className="select-topic-layout">
        <div className="topic-grid-column">
          <div className="column-header-mini">
            <span className="column-header-tag">⭐ Featured Categories</span>
          </div>
          <div className="topic-grid">
            {DEFAULT_TOPICS.map((topic) => (
              <button
                key={topic.title}
                type="button"
                className={`topic-card ${selected === topic.title && !custom.trim() ? 'selected' : ''}`}
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
        </div>

        <div className="custom-topic-column">
          {/* Custom Topic & Mode Customizer */}
          <div className="custom-topic-panel">
        <div className="custom-topic-header">
          <span className="material-symbols-outlined custom-icon">edit_note</span>
          <div>
            <h3>Custom Subject & Focus Settings</h3>
            <p>Type any subject or programming language (e.g. "Python", "React", "AI Lab Manual", "World War II")</p>
          </div>
        </div>

        <div className="custom-input-row">
          <input
            className="topic-input"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="Type custom subject (e.g. Python, Machine Learning, Java)..."
          />
        </div>

        {/* Theoretical vs Code-Based Toggle (Highlighted for custom / tech / programming) */}
        {isTechOrProg && (
          <div className="mode-selection-box">
            <div className="mode-selection-title">
              <span className="mode-title-tag">Question Focus for "{activeTopic}"</span>
            </div>

            <div className="mode-toggle-grid">
              <button
                type="button"
                className={`mode-toggle-card ${quizMode === 'theoretical' ? 'active' : ''}`}
                onClick={() => setQuizMode('theoretical')}
              >
                <div className="mode-card-icon">📚</div>
                <div className="mode-card-info">
                  <strong>Theoretical</strong>
                  <p>Concepts & architecture</p>
                </div>
                <div className="mode-pill">{quizMode === 'theoretical' ? '✓' : 'Select'}</div>
              </button>

              <button
                type="button"
                className={`mode-toggle-card ${quizMode === 'code' ? 'active' : ''}`}
                onClick={() => setQuizMode('code')}
              >
                <div className="mode-card-icon">💻</div>
                <div className="mode-card-info">
                  <strong>Code Snippets</strong>
                  <p>Outputs & syntax tracing</p>
                </div>
                <div className="mode-pill">{quizMode === 'code' ? '✓' : 'Select'}</div>
              </button>
            </div>
          </div>
        )}

        {/* Quiz Format Selector: Multiple Choice vs Hangaroo Word Blanks */}
        <div className="format-selection-box">
          <div className="format-selection-title">
            <span className="format-title-tag">Quiz Game Format</span>
          </div>

          <div className="format-toggle-grid">
            <button
              type="button"
              className={`format-card ${quizFormat === 'mcq' ? 'active' : ''}`}
              onClick={() => setQuizFormat('mcq')}
            >
              <span className="format-icon">🎯</span>
              <div className="format-text">
                <strong>Standard MCQ</strong>
                <span>4 block options & timer</span>
              </div>
            </button>

            <button
              type="button"
              className={`format-card ${quizFormat === 'hangaroo' ? 'active' : ''}`}
              onClick={() => setQuizFormat('hangaroo')}
            >
              <span className="format-icon">🦘</span>
              <div className="format-text">
                <strong>Hangaroo Blanks</strong>
                <span>Word guessing with lives</span>
              </div>
            </button>
          </div>
        </div>

        <div className="action-row align-between" style={{ marginTop: '10px' }}>
          <button className="secondary-btn" onClick={() => nav('/')}>
            ← Back
          </button>
          <button className="primary-btn pulse-glow-btn custom-next-btn" onClick={handleContinue}>
            Continue to {quizFormat === 'hangaroo' ? 'Hangaroo Game 🦘' : 'Difficulty Selection ➡️'}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
