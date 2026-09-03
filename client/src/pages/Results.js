import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveQuizResult } from '../api';
import KangarooMascot from '../components/KangarooMascot';
import Confetti from '../components/Confetti';
import { saveStageResult } from './Roadmap';

export default function Results() {
  const loc = useLocation();
  const nav = useNavigate();
  const { score, total, topic, difficulty, stageId, stageTitle, playerName, maxStreak } = loc.state || {};
  const currentPlayer = (playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  const percentage = total ? Math.round((score / total) * 100) : 0;
  const xpEarned = (score || 0) * 75 + (difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 50);
  const calculatedStars =
    score === total
      ? 3
      : score >= Math.ceil(total * 0.7)
      ? 2
      : score >= Math.ceil(total * 0.4)
      ? 1
      : 0;

  const isPassed = calculatedStars >= 1;
  const isPerfect = calculatedStars === 3;

  // Animate XP and Score counters
  useEffect(() => {
    if (xpEarned <= 0) return;
    let currentXp = 0;
    const step = Math.max(10, Math.floor(xpEarned / 25));
    const xpTimer = setInterval(() => {
      currentXp += step;
      if (currentXp >= xpEarned) {
        setAnimatedXP(xpEarned);
        clearInterval(xpTimer);
      } else {
        setAnimatedXP(currentXp);
      }
    }, 30);

    let curScore = 0;
    const scoreTimer = setInterval(() => {
      curScore += 1;
      if (curScore >= (score || 0)) {
        setAnimatedScore(score || 0);
        clearInterval(scoreTimer);
      } else {
        setAnimatedScore(curScore);
      }
    }, 80);

    return () => {
      clearInterval(xpTimer);
      clearInterval(scoreTimer);
    };
  }, [xpEarned, score]);

  useEffect(() => {
    if (score == null || total == null || !currentPlayer) return;

    // 1. Update Roadmap Stage Progress in localStorage
    if (stageId) {
      saveStageResult(currentPlayer, stageId, calculatedStars, score);
    }

    // 2. Persist to Supabase Database
    saveQuizResult({
      playerName: currentPlayer,
      topic: topic || 'General Quiz',
      difficulty: difficulty || 'medium',
      score,
      total,
      xpEarned,
      stars: calculatedStars,
      stageId: stageId || null
    })
      .then(() => {
        setSaved(true);
      })
      .catch((err) => {
        console.error('Failed to save quiz result to Supabase:', err);
        setSaveError('Saved locally. Database sync failed.');
      });
  }, [calculatedStars, currentPlayer, difficulty, score, stageId, topic, total, xpEarned]);

  if (score == null || total == null) {
    return (
      <div className="panel-shell empty-state">
        <KangarooMascot state="idle" size="small" message="Ready for another challenge?" />
        <h2>No results available.</h2>
        <button className="primary-btn" onClick={() => nav('/roadmap')}>
          Go to Roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="panel-shell result-shell">
      {isPassed && <Confetti active={isPassed} duration={4500} />}

      <div className="result-card">
        {/* Kangaroo Celebration */}
        <div className="result-mascot-wrap">
          <KangarooMascot
            state={isPassed ? 'feeding' : 'hit'}
            size="medium"
            message={
              isPerfect
                ? 'CRIPES! A PERFECT 3-STAR VICTORY! 🌟🏆👑'
                : isPassed
                ? 'Ripper job, mate! Stage Cleared! 🦘✨'
                : "Almost got it! Let's bounce back and conquer! 🥊"
            }
          />
        </div>

        <div className="result-header-text">
          <p className="eyebrow">{stageTitle ? `Quest: ${stageTitle}` : `Topic: ${topic}`}</p>
          <h1 className="result-main-title">
            {isPerfect ? '🌟 Magnificent Mastery!' : isPassed ? '🎉 Stage Cleared!' : '💪 Good Effort, Mate!'}
          </h1>
          <p className="result-subtitle">
            {isPassed
              ? `Outstanding run! You answered ${score} of ${total} correctly on ${topic}!`
              : `You scored ${score} out of ${total}. Earn at least 1 star to unlock the next level!`}
          </p>
        </div>

        {/* Animated 3-Star Badges */}
        <div className="result-stars-row">
          {[1, 2, 3].map((starNum) => {
            const isEarned = starNum <= calculatedStars;
            return (
              <div
                key={starNum}
                className={`result-star-item ${isEarned ? 'earned' : 'locked'} star-delay-${starNum}`}
              >
                <div className="star-icon-container">
                  <span className="star-char">{isEarned ? '⭐' : '★'}</span>
                </div>
                <span className="star-label">
                  {starNum === 1 ? '40% Pass' : starNum === 2 ? '70% Great' : '100% Master'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Database Save Indicator */}
        <div className="db-save-status">
          {saved ? (
            <span className="badge-saved">
              <span className="live-dot green" /> Synced to Supabase Database
            </span>
          ) : saveError ? (
            <span className="badge-error">⚠️ {saveError}</span>
          ) : (
            <span className="badge-saving">
              <span className="spinner-micro" /> Saving score to database...
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid results-grid">
          <div className="mini-card highlight-score">
            <span>Score</span>
            <strong>{animatedScore} / {total}</strong>
          </div>
          <div className="mini-card highlight-accuracy">
            <span>Accuracy</span>
            <strong>{percentage}%</strong>
          </div>
          <div className="mini-card full highlight-xp">
            <span>XP Rewarded</span>
            <strong className="xp-earned-num">+{animatedXP.toLocaleString()} XP</strong>
            {maxStreak > 1 && (
              <small className="streak-result-tag">🔥 Best Streak: {maxStreak} in a row</small>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-row stacked result-actions">
          <button className="primary-btn pulse-glow-btn" onClick={() => nav('/roadmap')}>
            🗺️ Continue on Roadmap
          </button>
          <div className="action-row align-between result-sub-actions">
            <button
              className="secondary-btn"
              onClick={() =>
                nav('/quiz', {
                  state: {
                    topic,
                    difficulty,
                    stageId,
                    stageTitle,
                    playerName: currentPlayer
                  }
                })
              }
            >
              🔁 Replay Quiz
            </button>
            <button className="secondary-btn" onClick={() => nav('/leaderboard')}>
              🏆 View Leaderboard
            </button>
            <button className="secondary-btn" onClick={() => nav('/history')}>
              📜 Quiz History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
