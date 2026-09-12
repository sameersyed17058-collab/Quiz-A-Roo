import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateHangaroo } from '../api';
import KangarooMascot from '../components/KangarooMascot';
import Confetti from '../components/Confetti';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_STRIKES = 4;

export default function HangarooQuiz() {
  const loc = useLocation();
  const nav = useNavigate();
  const { topic = 'General Knowledge', difficulty = 'medium', numQuestions = 5, playerName, examDocName, initialQuestions } = loc.state || {};
  const currentPlayer = (playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  const [loading, setLoading] = useState(!initialQuestions || !initialQuestions.length);
  const [puzzles, setPuzzles] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [strikes, setStrikes] = useState(0);
  const [mascotState, setMascotState] = useState('idle');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [roundWon, setRoundWon] = useState(false);

  // Load puzzles
  useEffect(() => {
    if (!currentPlayer) {
      nav('/');
      return;
    }

    if (initialQuestions && initialQuestions.length > 0) {
      setPuzzles(initialQuestions);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadPuzzles = async () => {
      setLoading(true);
      try {
        const data = await generateHangaroo({
          topic,
          difficulty,
          numQuestions: Number(numQuestions) || 5
        });
        if (isMounted) {
          setPuzzles(data);
        }
      } catch (err) {
        console.error('Failed to load Hangaroo puzzles:', err);
        if (isMounted) {
          alert('Failed to load Hangaroo puzzles: ' + (err.message || 'Error'));
          nav('/select-topic');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPuzzles();
    return () => {
      isMounted = false;
    };
  }, [topic, difficulty, numQuestions, currentPlayer, nav, initialQuestions]);

  const currentPuzzle = puzzles[currentIndex];
  const targetAnswer = (currentPuzzle?.answer || '').toUpperCase().trim();

  // Determine letters required
  const uniqueTargetLetters = useMemo(() => {
    const letters = new Set();
    for (const ch of targetAnswer) {
      if (ch >= 'A' && ch <= 'Z') letters.add(ch);
    }
    return letters;
  }, [targetAnswer]);

  // Check round status
  useEffect(() => {
    if (!currentPuzzle || isRoundOver) return;

    // Check if player won
    let allFound = true;
    for (const letter of uniqueTargetLetters) {
      if (!guessedLetters.has(letter)) {
        allFound = false;
        break;
      }
    }

    if (allFound && uniqueTargetLetters.size > 0) {
      setIsRoundOver(true);
      setRoundWon(true);
      setScore(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setMascotState('feeding');
      setMascotMessage('YAY! Ripper guess, mate! Word solved! 🍎🦘🎉');
      return;
    }

    // Check if player lost all lives
    if (strikes >= MAX_STRIKES) {
      setIsRoundOver(true);
      setRoundWon(false);
      setStreak(0);
      setMascotState('hit');
      setMascotMessage(`Oof! Out of carrots! The word was "${targetAnswer}"! 🥊💥`);
    }
  }, [guessedLetters, strikes, currentPuzzle, isRoundOver, uniqueTargetLetters, streak, maxStreak, targetAnswer]);

  // Handle letter guess
  const guessLetter = useCallback((letter) => {
    if (isRoundOver || loading || !currentPuzzle) return;
    const ch = letter.toUpperCase();
    if (ch < 'A' || ch > 'Z') return;
    if (guessedLetters.has(ch)) return;

    setGuessedLetters(prev => {
      const next = new Set(prev);
      next.add(ch);
      return next;
    });

    if (uniqueTargetLetters.has(ch)) {
      setMascotState('feeding');
      setMascotMessage(`Good on ya! "${ch}" is in the word! 🥕✨`);
    } else {
      setStrikes(s => s + 1);
      setMascotState('hit');
      setMascotMessage(`Crikey! No "${ch}" in this one! 💫`);
    }
  }, [isRoundOver, loading, currentPuzzle, guessedLetters, uniqueTargetLetters]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        guessLetter(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guessLetter]);

  // Hint button: reveal 1 unrevealed letter
  const useHint = () => {
    if (isRoundOver || showHint) return;
    setShowHint(true);
    const unrevealed = Array.from(uniqueTargetLetters).filter(ch => !guessedLetters.has(ch));
    if (unrevealed.length > 0) {
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      guessLetter(pick);
    }
  };

  // Next round or finish
  const nextPuzzle = () => {
    if (currentIndex === puzzles.length - 1) {
      // Finished all puzzles
      const finalScore = roundWon ? score : score;
      const total = puzzles.length;
      const stars =
        finalScore === total
          ? 3
          : finalScore >= Math.ceil(total * 0.7)
          ? 2
          : finalScore >= Math.ceil(total * 0.4)
          ? 1
          : 0;

      nav('/results', {
        state: {
          score: finalScore,
          total,
          stars,
          topic: examDocName ? `Exam: ${examDocName}` : `Hangaroo: ${topic}`,
          difficulty,
          playerName: currentPlayer,
          maxStreak
        }
      });
      return;
    }

    setCurrentIndex(i => i + 1);
    setGuessedLetters(new Set());
    setStrikes(0);
    setIsRoundOver(false);
    setRoundWon(false);
    setShowHint(false);
    setMascotState('idle');
    setMascotMessage('');
  };

  if (loading) {
    return (
      <div className="panel-shell centered-panel">
        <div className="loading-card">
          <KangarooMascot state="idle" size="small" message="Loading Hangaroo word blanks..." />
          <div className="spinner" aria-hidden="true" />
          <h2>Preparing Hangaroo Outback Challenge...</h2>
          <p>Topic: <b>{topic}</b> • Difficulty: <b>{difficulty.toUpperCase()}</b></p>
        </div>
      </div>
    );
  }

  if (!puzzles.length) {
    return (
      <div className="panel-shell empty-state">
        <KangarooMascot state="hit" size="small" message="No word blanks found." />
        <h2>No word blanks available.</h2>
        <button className="primary-btn" onClick={() => nav('/select-topic')}>Back to Topics</button>
      </div>
    );
  }

  const remainingLives = Math.max(0, MAX_STRIKES - strikes);

  return (
    <div className="panel-shell hangaroo-shell">
      {roundWon && isRoundOver && <Confetti active={true} duration={3500} />}

      {/* Top Header */}
      <div className="hangaroo-header">
        <div className="hangaroo-meta">
          <span className="hangaroo-brand-pill">🦘 Hangaroo Blanks</span>
          {examDocName ? (
            <span className="stage-title-pill exam-prep-pill">📄 {examDocName}</span>
          ) : (
            <span className="topic-pill">{topic}</span>
          )}
          <span className={`difficulty-pill ${difficulty}`}>{difficulty.toUpperCase()}</span>
        </div>

        <div className="hangaroo-status">
          {streak >= 2 && (
            <span className="streak-badge animate-pulse">🔥 {streak}x Streak!</span>
          )}
          <div className="score-live-badge">
            Solved: <b>{score}</b> / {puzzles.length}
          </div>
        </div>
      </div>

      {/* Lives & Progress */}
      <div className="hangaroo-lives-row">
        <div className="lives-carrots">
          <span className="lives-label">Kangaroo Lives:</span>
          {Array.from({ length: MAX_STRIKES }).map((_, i) => (
            <span
              key={i}
              className={`carrot-life ${i < remainingLives ? 'alive' : 'lost'}`}
              title={i < remainingLives ? 'Life active' : 'Strike lost'}
            >
              {i < remainingLives ? '🥕' : '❌'}
            </span>
          ))}
        </div>

        <div className="puzzle-progress-label">
          Puzzle {currentIndex + 1} of {puzzles.length}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="hangaroo-main-grid">
        {/* Kangaroo Mascot Display */}
        <div className="mascot-display-panel hangaroo-mascot-panel">
          <div className="mascot-mood-badge">
            {mascotState === 'feeding' ? '🌟 Yummy Treat!' : mascotState === 'hit' ? '💥 Bonked!' : '🦘 Ready!'}
          </div>
          <KangarooMascot state={mascotState} message={mascotMessage} size="small" />
        </div>

        {/* Board Panel */}
        <div className="hangaroo-board-panel">
          {/* Category & Clue */}
          <div className="hangaroo-clue-card">
            <span className="hangaroo-category-badge">
              Category: {currentPuzzle.category || topic}
            </span>
            <h2 className="hangaroo-clue-text">{currentPuzzle.clue}</h2>

            {showHint && currentPuzzle.hint && (
              <div className="hangaroo-hint-pill">
                💡 <b>Hint:</b> {currentPuzzle.hint}
              </div>
            )}
          </div>

          {/* Letter Blanks Display */}
          <div className="blank-tiles-container">
            {targetAnswer.split(' ').map((word, wIdx) => (
              <div key={wIdx} className="blank-word-group">
                {word.split('').map((letter, lIdx) => {
                  const isAlpha = letter >= 'A' && letter <= 'Z';
                  const isRevealed = !isAlpha || guessedLetters.has(letter) || (isRoundOver && !roundWon);
                  const isWrongMissed = isRoundOver && !roundWon && !guessedLetters.has(letter);

                  return (
                    <div
                      key={lIdx}
                      className={`tile-box ${isRevealed ? 'revealed' : 'hidden'} ${isWrongMissed ? 'missed' : ''}`}
                    >
                      <span className="tile-letter">
                        {isRevealed ? letter : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Virtual Keyboard */}
          <div className="hangaroo-keyboard">
            {ALPHABET.map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              const isCorrect = isGuessed && uniqueTargetLetters.has(letter);
              const isWrong = isGuessed && !uniqueTargetLetters.has(letter);

              let keyClass = 'key-btn';
              if (isCorrect) keyClass += ' correct';
              else if (isWrong) keyClass += ' wrong';

              return (
                <button
                  key={letter}
                  type="button"
                  className={keyClass}
                  disabled={isGuessed || isRoundOver}
                  onClick={() => guessLetter(letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="action-row align-between hangaroo-action-bar">
            <button className="link-btn exit-quiz-btn" onClick={() => nav('/select-topic')}>
              ✕ Exit Game
            </button>

            <div className="action-row">
              {!isRoundOver && !showHint && (
                <button className="secondary-btn hint-btn" onClick={useHint}>
                  💡 Reveal Hint Letter
                </button>
              )}

              {isRoundOver && (
                <button className="primary-btn pulse-glow-btn next-q-btn" onClick={nextPuzzle}>
                  {currentIndex === puzzles.length - 1 ? 'See Final Score 🏆' : 'Next Word ➡️'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
