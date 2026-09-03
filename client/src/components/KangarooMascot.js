import React, { useEffect, useState } from 'react';

const HAPPY_PHRASES = [
  'Yum! Delicious! 🍎',
  'Spot on, mate! 🌟',
  'Tasty! +XP 🦘✨',
  'Crikey, great answer! 🥕',
  'Pure genius! 🥭',
  'Nom nom nom! 🍓'
];

const OUCH_PHRASES = [
  'Ouch! That bonked! 💫',
  'Oof! My pouch! 💥',
  'Don\'t worry, bounce back! 🥊',
  'Crikey, that was tricky! ⭐',
  'Shake it off, mate! 🦘',
  'You got the next one! 💪'
];

const TREATS = ['🍎', '🥕', '🍓', '🥭', '🍉', '🍌'];

export default function KangarooMascot({ state = 'idle', message, showSpeech = true, size = 'medium' }) {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [randomTreat, setRandomTreat] = useState('🍎');

  useEffect(() => {
    if (state === 'feeding') {
      const phrase = message || HAPPY_PHRASES[Math.floor(Math.random() * HAPPY_PHRASES.length)];
      setCurrentPhrase(phrase);
      setRandomTreat(TREATS[Math.floor(Math.random() * TREATS.length)]);
    } else if (state === 'hit') {
      const phrase = message || OUCH_PHRASES[Math.floor(Math.random() * OUCH_PHRASES.length)];
      setCurrentPhrase(phrase);
    } else if (message) {
      setCurrentPhrase(message);
    } else {
      setCurrentPhrase('');
    }
  }, [state, message]);

  return (
    <div className={`kangaroo-container ${state} size-${size}`} role="img" aria-label={`Kangaroo Mascot in ${state} mood`}>
      {/* Speech Bubble */}
      {showSpeech && currentPhrase && (
        <div className={`speech-bubble ${state}`}>
          <span>{currentPhrase}</span>
        </div>
      )}

      {/* Floating Treat for Feeding State */}
      {state === 'feeding' && (
        <div className="flying-treat" aria-hidden="true">
          <span className="treat-icon">{randomTreat}</span>
          <span className="sparkle sp-1">✨</span>
          <span className="sparkle sp-2">⭐</span>
          <span className="sparkle sp-3">✨</span>
        </div>
      )}

      {/* Dizzy Stars for Hit State */}
      {state === 'hit' && (
        <div className="dizzy-stars" aria-hidden="true">
          <span className="dizzy-star ds-1">💫</span>
          <span className="dizzy-star ds-2">💥</span>
          <span className="dizzy-star ds-3">💫</span>
        </div>
      )}

      {/* Vector Kangaroo */}
      <div className="kangaroo-figure">
        <svg viewBox="0 0 200 220" className="kangaroo-svg">
          <defs>
            <radialGradient id="rooBodyGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#e59846" />
              <stop offset="70%" stopColor="#c5711e" />
              <stop offset="100%" stopColor="#9a4d09" />
            </radialGradient>
            <linearGradient id="rooBellyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3dd" />
              <stop offset="100%" stopColor="#feddb2" />
            </linearGradient>
            <linearGradient id="rooGloveGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Tail */}
          <path
            d="M 55 160 C 25 180, 10 200, 5 215 C 20 215, 60 195, 80 175 Z"
            fill="url(#rooBodyGrad)"
            className="roo-tail"
          />

          {/* Back Leg / Foot */}
          <ellipse cx="65" cy="180" rx="32" ry="18" fill="url(#rooBodyGrad)" />
          <ellipse cx="60" cy="195" rx="38" ry="11" fill="#9a4d09" />

          {/* Body */}
          <path
            d="M 80 95 C 60 115, 60 165, 85 185 C 115 195, 145 175, 140 125 C 138 105, 115 90, 80 95 Z"
            fill="url(#rooBodyGrad)"
            className="roo-torso"
          />

          {/* Belly Pouch */}
          <path
            d="M 95 125 C 80 135, 80 165, 105 175 C 128 178, 138 160, 132 135 C 125 125, 110 120, 95 125 Z"
            fill="url(#rooBellyGrad)"
            className="roo-pouch"
          />

          {/* Joey peeking out when happy */}
          {state === 'feeding' && (
            <g className="joey-peek">
              <circle cx="110" cy="140" r="10" fill="#e59846" />
              <circle cx="108" cy="138" r="2" fill="#1e1b18" />
              <ellipse cx="112" cy="142" rx="3" ry="2" fill="#9a4d09" />
              <path d="M 103 133 L 98 126 L 106 131 Z" fill="#c5711e" />
            </g>
          )}

          {/* Left Ear */}
          <path
            d="M 95 45 C 85 10, 80 0, 75 2 C 70 5, 80 25, 90 50 Z"
            fill="url(#rooBodyGrad)"
            className="roo-ear ear-left"
          />
          <path d="M 92 42 C 86 18, 82 8, 79 9 C 76 11, 83 26, 88 45 Z" fill="#fbcfe8" />

          {/* Right Ear */}
          <path
            d="M 125 45 C 135 10, 145 0, 150 2 C 155 5, 142 25, 130 50 Z"
            fill="url(#rooBodyGrad)"
            className="roo-ear ear-right"
          />
          <path d="M 127 42 C 134 18, 141 8, 145 9 C 147 11, 138 26, 131 45 Z" fill="#fbcfe8" />

          {/* Head */}
          <ellipse cx="110" cy="65" rx="30" ry="26" fill="url(#rooBodyGrad)" className="roo-head" />

          {/* Snout / Muzzle */}
          <path
            d="M 110 65 C 125 65, 155 72, 152 86 C 145 98, 115 95, 105 85 Z"
            fill="url(#rooBellyGrad)"
            className="roo-snout"
          />
          {/* Nose */}
          <ellipse cx="147" cy="80" rx="6" ry="4.5" fill="#1d1b1a" />

          {/* Mouth - Dynamic Expressions */}
          {state === 'feeding' ? (
            <path d="M 125 86 Q 138 102 146 88" stroke="#8d4b00" strokeWidth="3" fill="#ef4444" strokeLinecap="round" />
          ) : state === 'hit' ? (
            <path d="M 124 93 Q 135 83 146 92" stroke="#8d4b00" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M 126 87 Q 138 95 145 86" stroke="#8d4b00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Eyes - Dynamic Expressions */}
          {state === 'feeding' ? (
            // Joyful curved happy eyes (^_^)
            <g className="roo-eyes happy">
              <path d="M 104 60 Q 112 52 120 60" stroke="#1d1b1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 126 62 Q 133 55 140 62" stroke="#1d1b1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="102" cy="68" r="4" fill="#f472b6" opacity="0.6" />
              <circle cx="138" cy="70" r="4" fill="#f472b6" opacity="0.6" />
            </g>
          ) : state === 'hit' ? (
            // Dizzy X_X eyes
            <g className="roo-eyes dizzy">
              {/* Left X */}
              <line x1="106" y1="53" x2="116" y2="63" stroke="#1d1b1a" strokeWidth="3" strokeLinecap="round" />
              <line x1="116" y1="53" x2="106" y2="63" stroke="#1d1b1a" strokeWidth="3" strokeLinecap="round" />
              {/* Right X */}
              <line x1="126" y1="55" x2="136" y2="65" stroke="#1d1b1a" strokeWidth="3" strokeLinecap="round" />
              <line x1="136" y1="55" x2="126" y2="65" stroke="#1d1b1a" strokeWidth="3" strokeLinecap="round" />
              {/* Sweat drop */}
              <path d="M 98 48 C 96 44, 94 40, 96 38 C 98 36, 101 39, 100 44 Z" fill="#38bdf8" />
            </g>
          ) : (
            // Regular friendly alert eyes
            <g className="roo-eyes regular">
              <ellipse cx="112" cy="58" rx="5" ry="6" fill="#1d1b1a" />
              <circle cx="110" cy="56" r="2" fill="#ffffff" />
              <ellipse cx="132" cy="60" rx="4.5" ry="5.5" fill="#1d1b1a" />
              <circle cx="130.5" cy="58.5" r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Boxing Gloves / Front Paws */}
          <g className="roo-arms">
            {state === 'feeding' ? (
              // Open cheerful hands reaching up
              <g className="arms-feeding">
                <path d="M 95 110 Q 115 95 130 90" stroke="url(#rooBodyGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="132" cy="88" r="10" fill="url(#rooGloveGrad)" />
                <circle cx="112" cy="98" r="9" fill="url(#rooGloveGrad)" />
              </g>
            ) : state === 'hit' ? (
              // Clumsy dizzy arms covering head
              <g className="arms-hit">
                <path d="M 85 115 Q 95 80 110 70" stroke="url(#rooBodyGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
                <circle cx="112" cy="68" r="10" fill="url(#rooGloveGrad)" />
                <circle cx="85" cy="115" r="9" fill="url(#rooGloveGrad)" />
              </g>
            ) : (
              // Ready boxer kangaroo stance
              <g className="arms-idle">
                <path d="M 90 115 Q 110 118 128 112" stroke="url(#rooBodyGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
                <circle cx="132" cy="110" r="11" fill="url(#rooGloveGrad)" />
                <path d="M 80 120 Q 95 130 110 125" stroke="url(#rooBodyGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
                <circle cx="114" cy="126" r="9.5" fill="url(#rooGloveGrad)" />
              </g>
            )}
          </g>

          {/* Front Foot */}
          <ellipse cx="110" cy="198" rx="35" ry="12" fill="#9a4d09" />
          <ellipse cx="115" cy="192" rx="28" ry="14" fill="url(#rooBodyGrad)" />
        </svg>
      </div>
    </div>
  );
}
