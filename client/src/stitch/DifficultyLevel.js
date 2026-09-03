import React from 'react';
import { useNavigate } from 'react-router-dom';

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
];

export default function DifficultyLevel({ topic, onPick }) {
  const nav = useNavigate();

  const pick = (d) => {
    if (onPick) return onPick(d);
    nav('/quiz', { state: { topic, difficulty: d } });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-md text-headline-md">Select Difficulty</h2>
        <p className="text-on-surface-variant">Topic: <strong>{topic}</strong></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DIFFICULTIES.map(d => (
          <button key={d.id} onClick={() => pick(d.id)} className="p-6 rounded-xl bg-surface-container-low hover:bg-primary-fixed/10">{d.label}</button>
        ))}
      </div>
    </div>
  );
}
