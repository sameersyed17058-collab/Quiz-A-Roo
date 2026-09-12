export async function generateQuiz({ topic, difficulty, numQuestions = 5, quizMode = 'theoretical' }) {
  const res = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, numQuestions, quizMode })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to generate quiz');
  }

  const data = await res.json();
  
  let questions = [];
  
  if (data.generated) {
    if (Array.isArray(data.generated.questions)) {
      questions = data.generated.questions;
    } else if (Array.isArray(data.generated)) {
      questions = data.generated;
    }
  } else if (Array.isArray(data.questions)) {
    questions = data.questions;
  } else if (Array.isArray(data)) {
    questions = data;
  }
  
  if (!questions.length) {
    throw new Error('No questions returned from API');
  }
  
  return questions;
}

export async function registerPlayer(playerName) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create new explorer');
  return data;
}

export async function loginPlayer({ playerName, secretId }) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, secretId })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to login explorer');
  return data;
}

export async function saveUserProfile(playerName, secretId) {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, secretId })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync profile');
  return data;
}

export async function getPlayerProgress(playerName) {
  const res = await fetch(`/api/progress/${encodeURIComponent(playerName)}`);
  if (!res.ok) throw new Error('Failed to fetch player progress');
  return res.json();
}

export async function saveQuizResult({ playerName, topic, difficulty, score, total, xpEarned, stars, stageId }) {
  const res = await fetch('/api/quiz-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, topic, difficulty, score, total, xpEarned, stars, stageId })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save quiz result');
  return data;
}

export async function getQuizHistory(playerName) {
  const res = await fetch(`/api/history/${encodeURIComponent(playerName)}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch('/api/upload-document', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload document');
  return data;
}

export async function generateDocQuiz({ documentText, documentName, difficulty = 'medium', focus = 'comprehensive', numQuestions = 5, quizType = 'mcq' }) {
  const res = await fetch('/api/generate-doc-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentText, documentName, difficulty, focus, numQuestions, quizType })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate exam prep quiz from document');

  let questions = [];
  if (data.generated?.questions) questions = data.generated.questions;
  else if (Array.isArray(data.generated)) questions = data.generated;
  else if (Array.isArray(data.questions)) questions = data.questions;

  if (!questions.length) throw new Error('No questions generated from document');
  return { questions, metadata: data };
}

export async function generateHangaroo({ topic, difficulty = 'medium', numQuestions = 5 }) {
  const res = await fetch('/api/generate-hangaroo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, numQuestions })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate Hangaroo word puzzles');

  let questions = [];
  if (data.generated?.questions) questions = data.generated.questions;
  else if (Array.isArray(data.generated)) questions = data.generated;
  else if (Array.isArray(data.questions)) questions = data.questions;

  if (!questions.length) throw new Error('No puzzles generated');
  return questions;
}
