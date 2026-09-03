import React from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'science', title: 'Science & Nature', desc: 'Explore the wonders of the universe, biology, and physics.', icon: 'science' },
  { id: 'history', title: 'History', desc: 'Journey through time and test your knowledge of past eras.', icon: 'history_edu' },
  { id: 'pop', title: 'Pop Culture', desc: 'Movies, music, celebrities, and modern trends.', icon: 'movie' }
];

export default function CategorySelection({ onPick }) {
  const nav = useNavigate();

  const pick = (catId, title) => {
    if (onPick) return onPick(title);
    nav('/select-difficulty', { state: { topic: title } });
  };

  return (
    <div>
      <div className="mb-10 flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-4">Choose Your Subject</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Select a category to test your knowledge and climb the leaderboard.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => pick(c.id, c.title)} className="group relative bg-surface-container-low rounded-2xl overflow-hidden flex flex-col items-start text-left p-6 h-64 card-shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-primary-fixed border border-transparent hover:border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary-fixed/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-6 z-10 shadow-sm">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-background z-10 mb-2">{c.title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant z-10 flex-1">{c.desc}</p>
            <div className="mt-auto w-full flex justify-end z-10">
              <span className="material-symbols-outlined text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">arrow_forward</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
