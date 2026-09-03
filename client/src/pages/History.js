import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizHistory } from '../api';
import KangarooMascot from '../components/KangarooMascot';

export default function History() {
  const nav = useNavigate();
  const playerName = (localStorage.getItem('quizaroo-player-name') || '').trim();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'perfect' | 'passed'

  useEffect(() => {
    if (!playerName) {
      nav('/');
      return;
    }

    setLoading(true);
    getQuizHistory(playerName)
      .then((data) => {
        setHistory(data.history || []);
      })
      .catch((err) => {
        console.error('Failed to fetch history from database:', err);
        setError('Could not load quiz history from database. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [playerName, nav]);

  const totalQuizzes = history.length;
  const totalScore = history.reduce((acc, h) => acc + (h.score || 0), 0);
  const totalQuestions = history.reduce((acc, h) => acc + (h.total || 0), 0);
  const totalXP = history.reduce((acc, h) => acc + (h.xpEarned || 0), 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const threeStarCount = history.filter((h) => h.stars === 3 || (h.score === h.total && h.total > 0)).length;

  const filteredHistory = history.filter((item) => {
    const stars = item.stars || (item.score === item.total ? 3 : item.score >= Math.ceil(item.total * 0.7) ? 2 : item.score >= Math.ceil(item.total * 0.4) ? 1 : 0);
    if (filter === 'perfect') return stars === 3;
    if (filter === 'passed') return stars >= 1;
    return true;
  });

  return (
    <div className="history-shell">
      {/* Header Banner */}
      <div className="section-header compact">
        <div>
          <div className="eyebrow-badge">
            📜 Database Player Records
          </div>
          <h1>{playerName}'s Adventure History</h1>
          <p className="subtitle">Track every quiz round recorded in your Supabase adventure log.</p>
        </div>
        <div className="action-row">
          <button className="primary-btn" onClick={() => nav('/roadmap')}>🗺️ Play Roadmap</button>
          <button className="secondary-btn" onClick={() => nav('/leaderboard')}>🏆 View Leaderboard</button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="history-stats-grid">
        <div className="mini-card highlight-xp">
          <span>Total XP Earned</span>
          <strong className="stat-highlight">{totalXP.toLocaleString()} XP</strong>
        </div>
        <div className="mini-card highlight-quizzes">
          <span>Quizzes Played</span>
          <strong>{totalQuizzes}</strong>
        </div>
        <div className="mini-card highlight-acc">
          <span>Overall Accuracy</span>
          <strong>{avgAccuracy}%</strong>
        </div>
        <div className="mini-card highlight-stars">
          <span>3-Star Victories</span>
          <strong>{threeStarCount} 🌟</strong>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="panel-shell centered-panel">
          <div className="spinner" aria-hidden="true" />
          <h2>Loading your quiz history from database...</h2>
        </div>
      ) : error ? (
        <div className="panel-shell empty-state">
          <h2>{error}</h2>
          <button className="primary-btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : history.length === 0 ? (
        <div className="panel-shell empty-state">
          <KangarooMascot state="idle" size="small" message="No quiz history yet! Complete a quiz to start earning XP and trophies!" />
          <h2>No quiz records found in database yet.</h2>
          <p>Complete any round on the Quest Roadmap or Custom Categories to record your stats in the database!</p>
          <button className="primary-btn" onClick={() => nav('/roadmap')}>Start Your First Quiz 🚀</button>
        </div>
      ) : (
        <div className="history-list-panel">
          <div className="history-list-header">
            <h3>Recent Attempts ({filteredHistory.length} of {history.length})</h3>
            <div className="history-filters">
              <button
                className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Attempts
              </button>
              <button
                className={`filter-chip ${filter === 'perfect' ? 'active' : ''}`}
                onClick={() => setFilter('perfect')}
              >
                🌟 Perfect 3-Stars
              </button>
              <button
                className={`filter-chip ${filter === 'passed' ? 'active' : ''}`}
                onClick={() => setFilter('passed')}
              >
                ✅ Cleared
              </button>
            </div>
          </div>

          <div className="history-cards-wrap">
            {filteredHistory.map((item, idx) => {
              const stars =
                item.stars ||
                (item.score === item.total
                  ? 3
                  : item.score >= Math.ceil(item.total * 0.7)
                  ? 2
                  : item.score >= Math.ceil(item.total * 0.4)
                  ? 1
                  : 0);

              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent';

              return (
                <div key={item.id || idx} className="history-card">
                  <div className="history-card-left">
                    <div className="history-topic-title">
                      <strong>{item.topic}</strong>
                      <span className={`difficulty-tag ${item.difficulty?.toLowerCase()}`}>
                        {item.difficulty?.toUpperCase()}
                      </span>
                    </div>
                    <small className="history-date">📅 {dateStr}</small>
                  </div>

                  <div className="history-card-center">
                    <div className="history-stars">
                      {[1, 2, 3].map((s) => (
                        <span key={s} className={`star-icon ${s <= stars ? 'filled' : 'empty'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="history-accuracy">
                      {item.percentage || Math.round((item.score / item.total) * 100)}% Accuracy
                    </span>
                  </div>

                  <div className="history-card-right">
                    <div className="history-score-badge">
                      <strong>{item.score} / {item.total}</strong>
                      <span>Score</span>
                    </div>
                    <div className="history-xp-badge">
                      <strong>+{item.xpEarned}</strong>
                      <span>XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
