import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KangarooMascot from '../components/KangarooMascot';
import { getPlayerProgress } from '../api';

export const STAGES = [
  {
    id: 'stage-1',
    level: 1,
    title: "Joey's First Steps",
    subtitle: 'Warm up your wits with fun general trivia',
    topic: 'General Knowledge',
    difficulty: 'easy',
    numQuestions: 5,
    icon: 'sentiment_very_satisfied',
    color: '#10b981',
    xpReward: 300
  },
  {
    id: 'stage-2',
    level: 2,
    title: 'Bushland Explorer',
    subtitle: 'Discover Australian wildlife and natural science',
    topic: 'Science & Nature',
    difficulty: 'easy',
    numQuestions: 5,
    icon: 'forest',
    color: '#059669',
    xpReward: 400
  },
  {
    id: 'stage-3',
    level: 3,
    title: 'Great Barrier Reef',
    subtitle: 'Dive into pop culture, music, and oceanic facts',
    topic: 'Pop Culture',
    difficulty: 'medium',
    numQuestions: 5,
    icon: 'water',
    color: '#0284c7',
    xpReward: 550
  },
  {
    id: 'stage-4',
    level: 4,
    title: 'Outback Legends',
    subtitle: 'Travel through ancient eras and world history',
    topic: 'History',
    difficulty: 'medium',
    numQuestions: 5,
    icon: 'history_edu',
    color: '#d97706',
    xpReward: 650
  },
  {
    id: 'stage-5',
    level: 5,
    title: 'Red Desert Dunes',
    subtitle: 'Navigate capitals, mountain ranges, and global geography',
    topic: 'Geography',
    difficulty: 'hard',
    numQuestions: 5,
    icon: 'landscape',
    color: '#ea580c',
    xpReward: 800
  },
  {
    id: 'stage-6',
    level: 6,
    title: 'Tech Frontier',
    subtitle: 'Master future tech, artificial intelligence, and innovation',
    topic: 'Technology',
    difficulty: 'hard',
    numQuestions: 5,
    icon: 'memory',
    color: '#7c3aed',
    xpReward: 950
  },
  {
    id: 'stage-7',
    level: 7,
    title: 'Grand Kangaroo Champion',
    subtitle: 'The ultimate boss challenge for true trivia masters',
    topic: 'Science, History & World Mastery',
    difficulty: 'hard',
    numQuestions: 6,
    icon: 'military_tech',
    color: '#dc2626',
    xpReward: 1200
  }
];

export const getStageProgress = (playerName) => {
  const key = `quizaroo-stages-${playerName || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { 'stage-1': { unlocked: true, stars: 0, bestScore: 0 } };
  } catch {
    return { 'stage-1': { unlocked: true, stars: 0, bestScore: 0 } };
  }
};

export const saveStageResult = (playerName, stageId, stars, score) => {
  const key = `quizaroo-stages-${playerName || 'default'}`;
  const current = getStageProgress(playerName);
  const existingStars = current[stageId]?.stars || 0;
  const existingScore = current[stageId]?.bestScore || 0;

  const updatedStars = Math.max(existingStars, stars);
  const updatedScore = Math.max(existingScore, score);

  current[stageId] = {
    unlocked: true,
    stars: updatedStars,
    bestScore: updatedScore,
    completed: updatedStars > 0
  };

  // Unlock next stage if stars >= 1
  if (updatedStars >= 1) {
    const currentIndex = STAGES.findIndex((s) => s.id === stageId);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      const nextStageId = STAGES[currentIndex + 1].id;
      if (!current[nextStageId]) {
        current[nextStageId] = { unlocked: true, stars: 0, bestScore: 0 };
      } else {
        current[nextStageId].unlocked = true;
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(current));
  return current;
};

export default function Roadmap() {
  const nav = useNavigate();
  const playerName = (localStorage.getItem('quizaroo-player-name') || '').trim();
  const playerId = (localStorage.getItem('quizaroo-player-id') || '').trim();
  const [progress, setProgress] = useState(getStageProgress(playerName));
  const [selectedStage, setSelectedStage] = useState(null);
  const [syncedWithDb, setSyncedWithDb] = useState(false);

  useEffect(() => {
    if (!playerName) {
      nav('/');
      return;
    }

    // 1. Initial load from localStorage
    const local = getStageProgress(playerName);
    if (!local['stage-1']) {
      local['stage-1'] = { unlocked: true, stars: 0, bestScore: 0 };
    }
    setProgress(local);
    setSelectedStage(STAGES[0]);

    // 2. Fetch fresh stage progress from Supabase database and merge
    getPlayerProgress(playerName)
      .then((res) => {
        if (res && res.stageProgress) {
          const merged = { ...local };
          Object.keys(res.stageProgress).forEach((stageId) => {
            const dbStage = res.stageProgress[stageId];
            const locStage = merged[stageId] || { unlocked: false, stars: 0, bestScore: 0 };
            merged[stageId] = {
              unlocked: locStage.unlocked || dbStage.unlocked,
              stars: Math.max(locStage.stars || 0, dbStage.stars || 0),
              bestScore: Math.max(locStage.bestScore || 0, dbStage.bestScore || 0),
              completed: (locStage.stars || 0) > 0 || (dbStage.stars || 0) > 0
            };
          });

          // Ensure unlock chain
          STAGES.forEach((stage, idx) => {
            if (idx === 0) merged[stage.id].unlocked = true;
            if (merged[stage.id]?.stars >= 1 && idx < STAGES.length - 1) {
              const nextId = STAGES[idx + 1].id;
              if (!merged[nextId]) merged[nextId] = { unlocked: true, stars: 0, bestScore: 0 };
              else merged[nextId].unlocked = true;
            }
          });

          setProgress(merged);
          localStorage.setItem(`quizaroo-stages-${playerName}`, JSON.stringify(merged));
          setSyncedWithDb(true);
        }
      })
      .catch((err) => {
        console.warn('Database progress sync notice:', err.message);
      });
  }, [playerName, nav]);

  const totalStars = Object.values(progress).reduce((acc, curr) => acc + (curr?.stars || 0), 0);
  const maxPossibleStars = STAGES.length * 3;
  const completedStagesCount = Object.values(progress).filter((p) => p?.stars >= 1).length;

  const handlePlayStage = (stage) => {
    const stageInfo = progress[stage.id];
    const isUnlocked = stage.id === 'stage-1' || stageInfo?.unlocked;

    if (!isUnlocked) {
      alert('🔒 Clear the previous stage with at least 1 star to unlock this level!');
      return;
    }

    nav('/quiz', {
      state: {
        topic: stage.topic,
        difficulty: stage.difficulty,
        numQuestions: stage.numQuestions,
        stageId: stage.id,
        stageTitle: stage.title,
        playerName,
        playerId
      }
    });
  };

  return (
    <div className="roadmap-shell">
      {/* Header Banner */}
      <div className="roadmap-header">
        <div className="header-info">
          <div className="eyebrow-badge">
            🗺️ Explorer: <b>{playerName}</b>
            {syncedWithDb && <span className="sync-badge">✓ Database Synced</span>}
          </div>
          <h1>Quest Roadmap</h1>
          <p className="subtitle">
            Your journey progress is safely preserved in the database. Clear stages with stars to unlock the next levels!
          </p>
        </div>

        <div className="roadmap-stats-badges">
          <div className="stars-banner">
            <div className="star-icon-wrap">⭐</div>
            <div className="stars-count">
              <strong>{totalStars} / {maxPossibleStars}</strong>
              <span>Stars Earned</span>
            </div>
          </div>
          <div className="stages-progress-badge">
            <span className="stage-num-bold">{completedStagesCount} / {STAGES.length}</span>
            <span className="stage-num-label">Stages Cleared</span>
          </div>
        </div>
      </div>

      {/* Mascot Guide */}
      <div className="roadmap-mascot-guide">
        <KangarooMascot
          state="idle"
          size="small"
          message={`G'day, ${playerName}! Pick an unlocked stage to challenge! Replay stages to grab all 3 stars!`}
        />
      </div>

      {/* Winding Trail Map */}
      <div className="trail-map">
        {STAGES.map((stage, idx) => {
          const stageData = progress[stage.id];
          const isUnlocked = stage.id === 'stage-1' || stageData?.unlocked;
          const stars = stageData?.stars || 0;
          const isCompleted = stars > 0;
          const needsThreeStars = isCompleted && stars < 3;
          const isSelected = selectedStage?.id === stage.id;

          return (
            <div
              key={stage.id}
              className={`stage-node-wrap ${idx % 2 === 1 ? 'align-right' : 'align-left'} ${
                isUnlocked ? 'unlocked' : 'locked'
              } ${isSelected ? 'selected' : ''}`}
            >
              {/* Connector Path Line */}
              {idx < STAGES.length - 1 && (
                <div className={`trail-connector ${stars >= 1 ? 'active pulse-trail' : ''}`} />
              )}

              {/* Stage Card */}
              <div
                className="stage-card"
                onClick={() => {
                  setSelectedStage(stage);
                  if (isUnlocked) handlePlayStage(stage);
                }}
              >
                <div className="stage-level-badge" style={{ backgroundColor: stage.color }}>
                  Level {stage.level}
                </div>

                <div className="stage-body">
                  <div className="stage-topline">
                    <div className="stage-icon" style={{ backgroundColor: `${stage.color}22`, color: stage.color }}>
                      <span className="material-symbols-outlined">{stage.icon}</span>
                    </div>
                    <div className="stage-title-wrap">
                      <h3>{stage.title}</h3>
                      <div className="stage-badge-row">
                        <span className="stage-topic-badge">{stage.topic}</span>
                        <span className={`difficulty-tag ${stage.difficulty}`}>
                          {stage.difficulty.toUpperCase()}
                        </span>
                        <span className="xp-reward-pill">+{stage.xpReward} XP</span>
                      </div>
                    </div>
                    <div className="stage-status-icon">
                      {!isUnlocked ? (
                        <span className="lock-icon" title="Locked">🔒</span>
                      ) : isCompleted ? (
                        <span className="clear-icon" title="Cleared">✅</span>
                      ) : (
                        <span className="play-icon animate-bounce" title="Ready to play">▶️</span>
                      )}
                    </div>
                  </div>

                  <p className="stage-desc">{stage.subtitle}</p>

                  {/* Stars Row */}
                  <div className="stage-bottom-row">
                    <div className="stars-row">
                      {[1, 2, 3].map((starNum) => (
                        <span
                          key={starNum}
                          className={`star-pill ${starNum <= stars ? 'filled' : 'empty'}`}
                        >
                          ★
                        </span>
                      ))}
                      {stars > 0 ? (
                        <span className="stars-text">{stars}/3 Stars</span>
                      ) : isUnlocked ? (
                        <span className="stars-text unattempted">Not Attempted</span>
                      ) : (
                        <span className="stars-text locked-text">Locked</span>
                      )}
                    </div>

                    {/* Replay Indicator for stages < 3 stars */}
                    {needsThreeStars && (
                      <span className="replay-badge">
                        🔁 Replay for 3 ⭐
                      </span>
                    )}

                    {isUnlocked && (
                      <button
                        className="stage-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayStage(stage);
                        }}
                      >
                        {isCompleted ? (needsThreeStars ? 'Replay 🔁' : 'Play Again') : 'Start Quest 🚀'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
