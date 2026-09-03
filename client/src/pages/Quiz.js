import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateQuiz } from '../api';
import KangarooMascot from '../components/KangarooMascot';

export default function Quiz() {
  const loc = useLocation();
  const nav = useNavigate();
  const { topic, difficulty, numQuestions = 5, stageId, stageTitle, playerName } = loc.state || {};
  const currentPlayer = (playerName || localStorage.getItem('quizaroo-player-name') || '').trim();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [mascotState, setMascotState] = useState('idle'); // 'idle' | 'feeding' | 'hit'
  const [mascotMessage, setMascotMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [streakNotice, setStreakNotice] = useState('');

  useEffect(() => {
    if (!topic || !difficulty || !currentPlayer) {
      nav('/select-topic');
      return;
    }

    let isMounted = true;
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const data = await generateQuiz({
          topic,
          difficulty,
          numQuestions: Number(numQuestions) || 5
        });

        const questionsList = Array.isArray(data) ? data : data.questions || [];
        if (isMounted) {
          setQuiz(questionsList);
        }
      } catch (err) {
        console.error('Quiz generation failed:', err);
        if (isMounted) {
          alert('Failed to generate quiz: ' + (err.message || 'Unknown error'));
          nav('/roadmap');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadQuiz();
    return () => {
      isMounted = false;
    };
  }, [topic, difficulty, numQuestions, currentPlayer, nav]);

  // Question Timer
  useEffect(() => {
    if (!quiz.length || loading || isAnswerRevealed) return;
    setTimeLeft(20);

    const timer = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, currentIndex, loading, isAnswerRevealed]);

  const handleTimeOut = () => {
    if (isAnswerRevealed) return;
    setStreak(0);
    setMascotState('hit');
    setMascotMessage("Time's up, mate! Watch out! ⏰💥");
    setIsAnswerRevealed(true);

    setTimeout(() => {
      advanceQuestion();
    }, 1500);
  };

  const selectOption = (optionIndex) => {
    if (isAnswerRevealed) return; // Prevent double clicks
    const currentQuestion = quiz[currentIndex];
    const isCorrect = optionIndex === currentQuestion.answerIndex;

    setSelectedOption(optionIndex);
    setIsAnswerRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id || currentIndex]: optionIndex }));

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak >= 3) {
        setStreakNotice(`🔥 ${newStreak}x STREAK ON FIRE!`);
      } else if (newStreak === 2) {
        setStreakNotice('⚡ 2 in a row!');
      }

      setScore((s) => s + 1);
      setMascotState('feeding');
      setMascotMessage(
        newStreak >= 3
          ? `UNSTOPPABLE! ${newStreak} in a row! 🥭🔥`
          : 'Yummy treat! Spot on, mate! 🍎✨'
      );
    } else {
      setStreak(0);
      setStreakNotice('');
      setMascotState('hit');
      setMascotMessage('Oof! That bonked! Keep bouncing! 🥊💥');
    }

    // Auto-advance after giving time to enjoy the Kangaroo animation
    setTimeout(() => {
      advanceQuestion(isCorrect ? score + 1 : score);
    }, 1500);
  };

  const advanceQuestion = (currentScore = score) => {
    if (currentIndex === quiz.length - 1) {
      // Finished Quiz
      const finalScore = currentScore;
      const total = quiz.length;
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
          topic,
          difficulty,
          stageId,
          stageTitle,
          playerName: currentPlayer,
          maxStreak
        }
      });
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setMascotState('idle');
    setMascotMessage('');
    setStreakNotice('');
  };

  const formattedTime = useMemo(() => {
    const secs = Math.max(0, timeLeft);
    const minutes = String(Math.floor(secs / 60)).padStart(2, '0');
    const seconds = String(secs % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  if (loading) {
    return (
      <div className="panel-shell centered-panel">
        <div className="loading-card">
          <KangarooMascot state="idle" size="medium" message="Generating your challenge questions..." />
          <div className="spinner" aria-hidden="true" />
          <h2>Preparing AI Outback Trivia...</h2>
          <p>
            Topic: <b>{topic}</b> • Difficulty: <b>{difficulty.toUpperCase()}</b>
          </p>
        </div>
      </div>
    );
  }

  if (!quiz.length) {
    return (
      <div className="panel-shell empty-state">
        <KangarooMascot state="hit" size="small" message="Oops, something went wrong loading questions." />
        <h2>No questions available.</h2>
        <button className="primary-btn" onClick={() => nav('/roadmap')}>
          Back to Roadmap
        </button>
      </div>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const progress = ((currentIndex + 1) / quiz.length) * 100;

  return (
    <div className="panel-shell quiz-shell">
      {/* Quiz Topbar */}
      <div className="quiz-header">
        <div className="quiz-stage-info">
          {stageTitle ? (
            <span className="stage-title-pill">🗺️ {stageTitle}</span>
          ) : (
            <span className="stage-title-pill">🎯 Custom Match</span>
          )}
          <span className={`difficulty-pill ${difficulty}`}>
            {difficulty.toUpperCase()}
          </span>
          <span className="topic-pill">{topic}</span>
        </div>

        <div className="quiz-header-right">
          {streak >= 2 && (
            <div className="streak-badge animate-pulse">
              <span>{streakNotice}</span>
            </div>
          )}

          <div className="score-live-badge">
            <span>Score: <b>{score}</b> / {quiz.length}</span>
          </div>

          <div className={`timer ${timeLeft <= 5 ? 'danger pulse-heart' : ''}`}>
            <span className="material-symbols-outlined timer-icon">timer</span>
            <b>{formattedTime}</b>
          </div>
        </div>
      </div>

      {/* Progress Bar with Glowing Cap */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} className="progress-fill">
            <span className="progress-glow" />
          </span>
        </div>
        <div className="progress-label">
          Question {currentIndex + 1} of {quiz.length}
        </div>
      </div>

      {/* Interactive Mascot & Question Grid */}
      <div className="quiz-main-grid">
        {/* Kangaroo Mascot Section */}
        <div className="mascot-display-panel">
          <div className="mascot-mood-badge">
            {mascotState === 'feeding' ? '🌟 Happy & Fed!' : mascotState === 'hit' ? '💥 Bonked!' : '🦘 Ready!'}
          </div>
          <KangarooMascot state={mascotState} message={mascotMessage} size="medium" />
        </div>

        {/* Question Panel */}
        <div className="question-panel">
          <div className="question-header-row">
            <span className="q-badge">Question #{currentIndex + 1}</span>
            <span className="xp-potential-badge">
              +{difficulty === 'hard' ? '200' : difficulty === 'medium' ? '150' : '100'} XP / Correct
            </span>
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>

          {/* Options List */}
          <div className="answer-list">
            {currentQuestion.options.map((option, index) => {
              let optionClass = 'answer-option';
              if (isAnswerRevealed) {
                if (index === currentQuestion.answerIndex) {
                  optionClass += ' correct-answer';
                } else if (selectedOption === index) {
                  optionClass += ' wrong-answer';
                } else {
                  optionClass += ' dimmed';
                }
              } else if (selectedOption === index) {
                optionClass += ' selected';
              }

              return (
                <button
                  key={`${currentQuestion.id || currentIndex}-${index}`}
                  type="button"
                  className={optionClass}
                  disabled={isAnswerRevealed}
                  onClick={() => selectOption(index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                  {isAnswerRevealed && index === currentQuestion.answerIndex && (
                    <span className="feedback-icon correct">✅</span>
                  )}
                  {isAnswerRevealed && selectedOption === index && index !== currentQuestion.answerIndex && (
                    <span className="feedback-icon wrong">❌</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="action-row align-between quiz-bottom-bar">
        <button className="link-btn exit-quiz-btn" onClick={() => nav('/roadmap')}>
          ✕ Exit Quiz
        </button>

        {isAnswerRevealed && (
          <button className="primary-btn next-q-btn" onClick={() => advanceQuestion()}>
            {currentIndex === quiz.length - 1 ? 'See Results 🎉' : 'Next Question ➡️'}
          </button>
        )}
      </div>
    </div>
  );
}
