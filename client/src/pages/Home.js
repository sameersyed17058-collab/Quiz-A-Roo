import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KangarooMascot from '../components/KangarooMascot';
import { registerPlayer, loginPlayer } from '../api';

export default function Home() {
  const nav = useNavigate();
  const [playerName, setPlayerName] = useState(localStorage.getItem('quizaroo-player-name') || '');
  const [secretId, setSecretId] = useState(localStorage.getItem('quizaroo-secret-id') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [inputName, setInputName] = useState('');
  const [inputSecretId, setInputSecretId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newAccountKey, setNewAccountKey] = useState(null); // Show key reveal modal/card
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const isLoggedIn = !!(playerName && secretId);

  const handleRegister = async () => {
    setError('');
    const cleanName = inputName.trim();
    if (!cleanName) {
      setError('Please enter an Explorer Name to create your profile.');
      return;
    }

    if (cleanName.length < 2) {
      setError('Explorer Name must be at least 2 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerPlayer(cleanName);
      if (res && res.user) {
        const assignedSecret = res.user.secretId;
        localStorage.setItem('quizaroo-player-name', res.user.name);
        localStorage.setItem('quizaroo-secret-id', assignedSecret);
        setPlayerName(res.user.name);
        setSecretId(assignedSecret);

        if (res.stageProgress) {
          localStorage.setItem(`quizaroo-stages-${res.user.name}`, JSON.stringify(res.stageProgress));
        }

        // Show key reveal card so player can save their secret ID
        setNewAccountKey(assignedSecret);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to create new explorer. That name might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    const cleanName = inputName.trim();
    const cleanSecret = inputSecretId.trim();

    if (!cleanName) {
      setError('Please enter your Explorer Name.');
      return;
    }

    if (!cleanSecret) {
      setError('Please enter your Secret Explorer ID (e.g. ROO-123456).');
      return;
    }

    setLoading(true);
    try {
      const res = await loginPlayer({ playerName: cleanName, secretId: cleanSecret });
      if (res && res.user) {
        const assignedSecret = res.user.secretId;
        localStorage.setItem('quizaroo-player-name', res.user.name);
        localStorage.setItem('quizaroo-secret-id', assignedSecret);
        setPlayerName(res.user.name);
        setSecretId(assignedSecret);

        if (res.stageProgress) {
          localStorage.setItem(`quizaroo-stages-${res.user.name}`, JSON.stringify(res.stageProgress));
        }

        nav('/roadmap', { state: { playerName: res.user.name, secretId: assignedSecret } });
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = (keyToCopy = secretId || newAccountKey) => {
    if (!keyToCopy) return;
    navigator.clipboard.writeText(keyToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleLogout = () => {
    localStorage.removeItem('quizaroo-player-name');
    localStorage.removeItem('quizaroo-secret-id');
    setPlayerName('');
    setSecretId('');
    setInputName('');
    setInputSecretId('');
    setNewAccountKey(null);
    setError('');
  };

  return (
    <section className="hero panel-shell">
      <div className="hero-copy">
        <div className="eyebrow-badge">
          🦘 Interactive AI Outback Quest
        </div>
        <h1 className="hero-title">Hop into Smart Outback Trivia with Quiz-a-roo!</h1>
        <p className="hero-desc">
          Embark on an Australian trivia adventure! Feed your kangaroo companion, conquer levels on the Quest Roadmap, and save your progress with your <b>Secret Explorer ID</b> to continue anytime.
        </p>

        {/* Brand New Account Key Notice Modal / Card */}
        {newAccountKey ? (
          <div className="new-account-key-card">
            <div className="key-card-header">
              <span className="key-icon">🔑</span>
              <div>
                <h3>Explorer Profile Created!</h3>
                <p>Welcome, <b>{playerName}</b>! Below is your private Secret Explorer ID:</p>
              </div>
            </div>

            <div className="secret-id-display-box">
              <span className="secret-id-value">{newAccountKey}</span>
              <button
                className="copy-btn large-copy"
                onClick={() => handleCopySecret(newAccountKey)}
              >
                {copied ? '✅ Copied to Clipboard!' : '📋 Copy Secret ID'}
              </button>
            </div>

            <div className="key-warning-pill">
              ⚠️ <b>IMPORTANT:</b> Keep your Secret ID safe! You will need both your Name and Secret ID to log back in to your levels and stars.
            </div>

            <div className="action-row" style={{ marginTop: 18 }}>
              <button
                className="primary-btn pulse-glow-btn"
                onClick={() => nav('/roadmap')}
              >
                🗺️ Start Quest Roadmap 🚀
              </button>
            </div>
          </div>
        ) : isLoggedIn ? (
          /* Active Logged-in Profile Card */
          <div className="current-player-card">
            <div className="active-player-top">
              <div className="active-avatar">🦘</div>
              <div className="active-meta">
                <span className="active-badge">Active Explorer Profile</span>
                <strong className="active-name">{playerName}</strong>
                <div className="active-id-row">
                  <span className="id-chip">
                    Secret ID: <b>{showSecret ? secretId : '••••••••••'}</b>
                  </span>
                  <button
                    className="toggle-secret-btn"
                    onClick={() => setShowSecret(!showSecret)}
                    title={showSecret ? 'Hide ID' : 'Reveal ID'}
                  >
                    {showSecret ? '👁️' : '🔒'}
                  </button>
                  <button className="copy-btn" onClick={() => handleCopySecret(secretId)}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>

            <p className="active-hint">
              Your passed levels and stars are automatically saved to your Explorer account!
            </p>

            <div className="action-row hero-actions">
              <button
                className="primary-btn hero-primary-btn pulse-glow-btn"
                onClick={() => nav('/roadmap')}
              >
                🗺️ Quest Roadmap
              </button>
              <button
                className="secondary-btn"
                onClick={() => nav('/exam-prep', { state: { playerName } })}
              >
                📄 Exam Prep
              </button>
              <button
                className="secondary-btn"
                onClick={() => nav('/hangaroo', { state: { playerName } })}
              >
                🦘 Hangaroo
              </button>
              <button
                className="secondary-btn"
                onClick={() => nav('/select-topic', { state: { playerName } })}
              >
                🎯 Custom Quiz
              </button>
              <button
                className="link-btn switch-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Card */
          <div className="auth-form-panel">
            {/* Mode Switch Tabs */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
              >
                🔑 Login with Secret ID
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                }}
              >
                🌟 New Explorer
              </button>
            </div>

            <div className="name-field-wrap">
              <label htmlFor="explorer-name">
                <span className="label-text">Explorer Name</span>
                <span className="label-sub">
                  {authMode === 'register' ? 'Choose your adventurer name' : 'Your registered name'}
                </span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  id="explorer-name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (authMode === 'register') handleRegister();
                      else handleLogin();
                    }
                  }}
                  placeholder="Enter your name (e.g. Skippy or Talal)"
                  className="player-name-input"
                />
              </div>
            </div>

            {authMode === 'login' && (
              <div className="name-field-wrap id-field-wrap">
                <label htmlFor="secret-id">
                  <span className="label-text">Secret Explorer ID</span>
                  <span className="label-sub">e.g. ROO-247496</span>
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">🔑</span>
                  <input
                    id="secret-id"
                    value={inputSecretId}
                    onChange={(e) => setInputSecretId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter your Secret ID (e.g. ROO-247496)"
                    className="player-name-input"
                  />
                </div>
              </div>
            )}

            {error && <div className="auth-error-banner">⚠️ {error}</div>}

            <div className="action-row hero-actions">
              {authMode === 'login' ? (
                <button
                  className="primary-btn hero-primary-btn"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? 'Verifying Credentials...' : '🔑 Login & Resume Quest'}
                </button>
              ) : (
                <button
                  className="primary-btn hero-primary-btn"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? 'Creating Explorer...' : '🌟 Create New Explorer'}
                </button>
              )}

              <button
                className="secondary-btn"
                onClick={() => nav('/leaderboard')}
              >
                🏆 View Leaderboard
              </button>
            </div>
          </div>
        )}

        <div className="hero-feature-tags">
          <span className="ft-tag clickable-tag" onClick={() => nav('/exam-prep')}>📄 Exam Prep Studio</span>
          <span className="ft-tag clickable-tag" onClick={() => nav('/hangaroo')}>🦘 Hangaroo Blanks</span>
          <span className="ft-tag">🔒 Secret Explorer IDs</span>
          <span className="ft-tag">⭐ Saved Progress</span>
        </div>
      </div>

      <div className="hero-panel">
        <div className="hero-mascot-card">
          <KangarooMascot
            state="idle"
            size="large"
            message={
              playerName
                ? `G'day, ${playerName}! Ready to hop onto level 1?`
                : authMode === 'login'
                ? "G'day explorer! Enter your Name & Secret ID to resume your journey!"
                : "Welcome, newcomer! Type a name to create your explorer tag!"
            }
          />
        </div>

        <div className="stats-grid">
          <div className="mini-card highlight-gold">
            <strong>7</strong>
            <span>Quest Levels</span>
          </div>
          <div className="mini-card highlight-stars">
            <strong>⭐⭐⭐</strong>
            <span>Star Mastery</span>
          </div>
          <div className="mini-card highlight-xp-stat">
            <strong>XP</strong>
            <span>Global Ranks</span>
          </div>
        </div>
      </div>
    </section>
  );
}
