const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';

/**
 * Safely parse fetch responses.
 * Avoids browser-crashing "Unexpected end of JSON input" errors when the server
 * returns an empty body, HTML error page, 404, or 502/504 gateway timeout.
 */
async function parseResponse(res, fallbackError = 'Request failed') {
  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Body is not JSON (e.g., HTML error or plaintext)
    }
  }

  if (!res.ok) {
    const errorMsg =
      (data && (data.error || data.message)) ||
      (text && text.length < 200 && !text.includes('<html') ? text : null) ||
      `${fallbackError} (Status ${res.status})`;
    throw new Error(errorMsg);
  }

  return data || {};
}

export async function generateQuiz({ topic, difficulty, numQuestions = 5, quizMode = 'theoretical' }) {
  const res = await fetch(`${API_BASE}/api/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, numQuestions, quizMode })
  });

  const data = await parseResponse(res, 'Failed to generate quiz');

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
  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName })
  });

  return parseResponse(res, 'Failed to create new explorer');
}

export async function loginPlayer({ playerName, secretId }) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, secretId })
  });

  return parseResponse(res, 'Failed to login explorer');
}

export async function saveUserProfile(playerName, secretId) {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, secretId })
  });

  return parseResponse(res, 'Failed to sync profile');
}

export async function getPlayerProgress(playerName) {
  const res = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(playerName)}`);
  return parseResponse(res, 'Failed to fetch player progress');
}

export async function saveQuizResult({ playerName, topic, difficulty, score, total, xpEarned, stars, stageId }) {
  const res = await fetch(`${API_BASE}/api/quiz-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, topic, difficulty, score, total, xpEarned, stars, stageId })
  });

  return parseResponse(res, 'Failed to save quiz result');
}

export async function getQuizHistory(playerName) {
  const res = await fetch(`${API_BASE}/api/history/${encodeURIComponent(playerName)}`);
  return parseResponse(res, 'Failed to fetch history');
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard`);
  return parseResponse(res, 'Failed to fetch leaderboard');
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_BASE}/api/upload-document`, {
    method: 'POST',
    body: formData
  });

  return parseResponse(res, 'Failed to upload document');
}

export async function generateDocQuiz({ documentText, documentName, difficulty = 'medium', focus = 'comprehensive', numQuestions = 5, quizType = 'mcq' }) {
  const res = await fetch(`${API_BASE}/api/generate-doc-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentText, documentName, difficulty, focus, numQuestions, quizType })
  });

  const data = await parseResponse(res, 'Failed to generate exam prep quiz from document');

  let questions = [];
  if (data.generated?.questions) questions = data.generated.questions;
  else if (Array.isArray(data.generated)) questions = data.generated;
  else if (Array.isArray(data.questions)) questions = data.questions;

  if (!questions.length) throw new Error('No questions generated from document');
  return { questions, metadata: data };
}

export async function generateHangaroo({ topic, difficulty = 'medium', numQuestions = 5 }) {
  const res = await fetch(`${API_BASE}/api/generate-hangaroo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, numQuestions })
  });

  const data = await parseResponse(res, 'Failed to generate Hangaroo word puzzles');

  let questions = [];
  if (data.generated?.questions) questions = data.generated.questions;
  else if (Array.isArray(data.generated)) questions = data.generated;
  else if (Array.isArray(data.questions)) questions = data.questions;

  if (!questions.length) throw new Error('No puzzles generated');
  return questions;
}
