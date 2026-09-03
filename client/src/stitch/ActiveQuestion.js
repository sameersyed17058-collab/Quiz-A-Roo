import React from 'react';

export default function ActiveQuestion({ question, selectedIndex, onSelect }) {
  if (!question) return null;
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl card-shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">Q</div>
        <div className="flex-1">
          <div className="mb-4"><strong className="text-headline-md">{question.id}. {question.question}</strong></div>
          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${selectedIndex===i ? 'border-primary' : 'border-transparent'} hover:bg-surface-variant/50`}>
                <input type="radio" name={`q${question.id}`} checked={selectedIndex===i} onChange={() => onSelect(i)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
