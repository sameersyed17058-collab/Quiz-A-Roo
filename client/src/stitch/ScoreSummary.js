import React from 'react';

export default function ScoreSummary({ score, total, onDone }) {
  return (
    <div className="p-6 bg-surface-container-low rounded-2xl card-shadow">
      <h3 className="font-headline-md">Score Summary</h3>
      <p className="mt-4">You scored <strong>{score}</strong> out of <strong>{total}</strong>.</p>
      <div className="mt-6">
        <button className="btn bg-primary-container text-on-primary-container" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
