import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api';
import KangarooMascot from '../components/KangarooMascot';
import Confetti from '../components/Confetti';

export default function Leaderboard() {
  const nav = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const currentUser = (localStorage.getItem('quizaroo-player-name') || '').trim();

  const fetchLeaderboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getLeaderboard();
      const rawList = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      
      // Clean and sort by XP descending
      const realLeaders = rawList
        .filter((entry) => entry && entry.name && entry.name.trim().length > 0)
        .sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));

      setLeaders(realLeaders);

      // Trigger confetti if current user is #1
      if (realLeaders.length > 0 && realLeaders[0].name.toLowerCase() === currentUser.toLowerCase()) {
        setShowConfetti(true);
      }
    } catch (err) {
      console.error('Failed to load real leaderboard from database:', err);
      setLeaders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const filteredLeaders = leaders.filter((leader) =>
    leader.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaders.slice(0, 3);
  const currentUserIndex = leaders.findIndex(
    (leader) => leader.name.toLowerCase() === currentUser.toLowerCase()
  );
  const currentUserData = currentUserIndex >= 0 ? leaders[currentUserIndex] : null;

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="leaderboard-shell">
      {showConfetti && <Confetti active={showConfetti} duration={4000} />}

      {/* Header Bar */}
      <div className="section-header compact">
        <div>
          <div className="eyebrow-badge">
            <span className="live-dot" /> Live Supabase Standings
          </div>
          <h1>Global Leaderboard</h1>
          <p className="subtitle">
            Battle trivia masters, earn XP on your adventures, and claim the Outback Champion Crown!
          </p>
        </div>

        <div className="action-row">
          <button
            className="secondary-btn refresh-btn"
            onClick={() => fetchLeaderboardData(true)}
            disabled={refreshing || loading}
            title="Refresh leaderboard from database"
          >
            <span className={`material-symbols-outlined ${refreshing ? 'spin' : ''}`}>sync</span>
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <button className="primary-btn" onClick={() => nav('/roadmap')}>
            🗺️ Play & Earn XP
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="leaderboard-toolbar">
        <div className="search-bar-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="leaderboard-search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <div className="player-count-badge">
          <strong>{leaders.length}</strong> {leaders.length === 1 ? 'Explorer' : 'Explorers'} Ranked
        </div>
      </div>

      {/* Current User Highlighting Banner */}
      {currentUser && (
        <div className="current-user-banner">
          <div className="cur-user-avatar">
            {getInitials(currentUser)}
          </div>
          <div className="cur-user-info">
            <div className="cur-user-title">
              <strong>{currentUser}</strong>
              <span className="cur-tag">You</span>
            </div>
            <span className="cur-user-sub">
              {currentUserData ? (
                <>Rank <b>#{currentUserIndex + 1}</b> with {currentUserData.quizzes || 0} quizzes completed</>
              ) : (
                <>Not ranked yet. Complete a quiz to join the ranks!</>
              )}
            </span>
          </div>
          <div className="cur-user-xp">
            <strong>{(currentUserData?.xp || 0).toLocaleString()}</strong>
            <span>Total XP</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="panel-shell centered-panel">
          <div className="spinner" aria-hidden="true" />
          <h2>Fetching live database standings...</h2>
          <p>Connecting to Supabase player records...</p>
        </div>
      ) : leaders.length === 0 ? (
        <div className="panel-shell empty-state">
          <KangarooMascot
            state="idle"
            size="medium"
            message="The leaderboard is waiting for its first hero! Hop onto the Roadmap and claim the #1 spot!"
          />
          <h2>No players on the leaderboard yet!</h2>
          <p>Be the very first explorer to complete a quiz and etch your name in the Hall of Fame!</p>
          <button className="primary-btn" onClick={() => nav('/roadmap')}>
            Hop In & Take First Place 👑
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {!searchQuery && topThree.length > 0 && (
            <div className="podium-section">
              <div className="podium">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="podium-card second">
                    <div className="podium-rank-badge silver">2</div>
                    <div className="podium-medal">🥈</div>
                    <div className="avatar silver">{getInitials(topThree[1].name)}</div>
                    <strong className="podium-name">{topThree[1].name}</strong>
                    <div className="podium-xp">{Number(topThree[1].xp).toLocaleString()} XP</div>
                    <div className="podium-quizzes">{topThree[1].quizzes || 0} quizzes</div>
                    <div className="podium-pedestal p-2">
                      <span className="pedestal-num">2nd</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="podium-card first">
                    <div className="podium-crown">👑</div>
                    <div className="podium-rank-badge gold">1</div>
                    <div className="podium-medal">🥇</div>
                    <div className="avatar gold">{getInitials(topThree[0].name)}</div>
                    <strong className="podium-name">{topThree[0].name}</strong>
                    <div className="podium-xp gold-text">{Number(topThree[0].xp).toLocaleString()} XP</div>
                    <div className="podium-quizzes">{topThree[0].quizzes || 0} quizzes</div>
                    <div className="podium-pedestal p-1">
                      <span className="pedestal-num">1st Champion</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="podium-card third">
                    <div className="podium-rank-badge bronze">3</div>
                    <div className="podium-medal">🥉</div>
                    <div className="avatar bronze">{getInitials(topThree[2].name)}</div>
                    <strong className="podium-name">{topThree[2].name}</strong>
                    <div className="podium-xp">{Number(topThree[2].xp).toLocaleString()} XP</div>
                    <div className="podium-quizzes">{topThree[2].quizzes || 0} quizzes</div>
                    <div className="podium-pedestal p-3">
                      <span className="pedestal-num">3rd</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Leaderboard List */}
          <div className="leaderboard-table-card">
            <div className="table-header-row">
              <span className="th-rank">Rank</span>
              <span className="th-player">Explorer</span>
              <span className="th-quizzes">Quizzes</span>
              <span className="th-xp">Total XP</span>
            </div>

            <div className="leaderboard-list">
              {filteredLeaders.length === 0 ? (
                <div className="no-search-results">
                  <p>No explorers found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredLeaders.map((leader, index) => {
                  const actualRank = leaders.findIndex((l) => l.name === leader.name) + 1;
                  const isCurrent = currentUser && leader.name.toLowerCase() === currentUser.toLowerCase();
                  const isTopOne = actualRank === 1;
                  const isTopTwo = actualRank === 2;
                  const isTopThree = actualRank === 3;

                  return (
                    <div
                      key={`${leader.name}-${actualRank}`}
                      className={`user-row ${isCurrent ? 'highlight' : ''} ${isTopOne ? 'rank-1' : isTopTwo ? 'rank-2' : isTopThree ? 'rank-3' : ''}`}
                    >
                      <div className="rank-badge-wrap">
                        {isTopOne ? (
                          <span className="medal-icon gold-medal">🥇</span>
                        ) : isTopTwo ? (
                          <span className="medal-icon silver-medal">🥈</span>
                        ) : isTopThree ? (
                          <span className="medal-icon bronze-medal">🥉</span>
                        ) : (
                          <span className="rank-number">#{actualRank}</span>
                        )}
                      </div>

                      <div className="player-meta-wrap">
                        <div className={`avatar small ${isTopOne ? 'gold' : isTopTwo ? 'silver' : isTopThree ? 'bronze' : 'standard'}`}>
                          {getInitials(leader.name)}
                        </div>
                        <div className="user-meta">
                          <div className="name-with-badges">
                            <strong>{leader.name}</strong>
                            {isCurrent && <span className="you-pill">You</span>}
                            {isTopOne && <span className="crown-pill">👑 Outback Leader</span>}
                          </div>
                        </div>
                      </div>

                      <div className="quizzes-count">
                        <span className="material-symbols-outlined quiz-icon">quiz</span>
                        <b>{leader.quizzes || 0}</b>
                      </div>

                      <div className="user-score">
                        <strong className="xp-amount">{Number(leader.xp).toLocaleString()}</strong>
                        <small className="xp-unit">XP</small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
