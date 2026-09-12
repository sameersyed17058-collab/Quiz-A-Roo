const fs = require('fs');
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Quiz-A-Roo Team';
pptx.subject = 'Quiz-A-Roo project documentation';
pptx.title = 'Quiz-A-Roo | Project Documentation';
pptx.company = 'Quiz-A-Roo';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US'
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F7F9FC' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.16, fill: { color: 'F36F3D' }, line: { color: 'F36F3D' } } },
    { text: { text: 'QUIZ-A-ROO  /  PROJECT DOCUMENTATION', options: { x: 0.45, y: 7.18, w: 6.5, h: 0.18, fontFace: 'Aptos', fontSize: 7, color: '718096', margin: 0, breakLine: false } } },
    { text: { text: '2026', options: { x: 12.25, y: 7.18, w: 0.6, h: 0.18, fontFace: 'Aptos', fontSize: 7, color: '718096', align: 'right', margin: 0 } } }
  ],
  slideNumber: { x: 12.92, y: 7.18, color: '718096', fontFace: 'Aptos', fontSize: 7 }
});

const C = { navy: '132238', ink: '243447', muted: '617083', orange: 'F36F3D', yellow: 'F7B84B', teal: '19A7A0', blue: '3182CE', green: '38A169', red: 'D64550', pale: 'EAF0F6', white: 'FFFFFF', line: 'D8E1EA' };
const W = 13.333;

function esc(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function svgData(svg) { return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`; }
function addTitle(slide, title, kicker = '') {
  if (kicker) slide.addText(kicker.toUpperCase(), { x: 0.55, y: 0.42, w: 4.5, h: 0.18, fontSize: 8, bold: true, color: C.orange, charSpacing: 1.5, margin: 0 });
  slide.addText(title, { x: 0.55, y: kicker ? 0.67 : 0.48, w: 11.9, h: 0.5, fontFace: 'Aptos Display', fontSize: 25, bold: true, color: C.navy, margin: 0 });
}
function addText(slide, text, x, y, w, h, opts = {}) { slide.addText(text, { x, y, w, h, fontFace: opts.fontFace || 'Aptos', fontSize: opts.fontSize || 12, color: opts.color || C.ink, bold: opts.bold || false, margin: opts.margin === undefined ? 0.06 : opts.margin, breakLine: false, valign: opts.valign || 'mid', fit: 'shrink', align: opts.align || 'left', bullet: opts.bullet }); }
function box(slide, x, y, w, h, fill = C.white, line = C.line, radius = 0.12) { slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: line, width: 1 } }); }
function pill(slide, text, x, y, w, color) { slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.28, rectRadius: 0.14, fill: { color }, line: { color } }); addText(slide, text, x, y + 0.01, w, 0.22, { fontSize: 8, bold: true, color: C.white, align: 'center' }); }
function arrow(slide, x1, y1, x2, y2, color = C.orange, width = 1.5) { slide.addShape(pptx.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width, beginArrowType: 'none', endArrowType: 'triangle' } }); }
function node(slide, label, x, y, w, h, fill = C.white, border = C.blue, textColor = C.ink) { box(slide, x, y, w, h, fill, border); addText(slide, label, x + 0.08, y + 0.05, w - 0.16, h - 0.1, { fontSize: 10, bold: true, color: textColor, align: 'center' }); }
function addNotes(slide, text) { slide.addNotes(text); }
function card(slide, x, y, w, h, title, body, color = C.blue) { box(slide, x, y, w, h); slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color }, line: { color } }); addText(slide, title, x + 0.2, y + 0.16, w - 0.35, 0.26, { fontSize: 13, bold: true, color: C.navy }); addText(slide, body, x + 0.2, y + 0.53, w - 0.35, h - 0.68, { fontSize: 10, color: C.muted, valign: 'top' }); }

function screenshotSvg(kind) {
  const title = kind === 'topic' ? 'Choose Your Trivia Subject' : kind === 'quiz' ? 'Question 2 of 5' : 'Your Explorer Results';
  const accent = kind === 'topic' ? '#3182CE' : kind === 'quiz' ? '#F36F3D' : '#19A7A0';
  const content = kind === 'topic'
    ? `<text x="40" y="125" class="h">Choose Your Trivia Subject</text><text x="40" y="154" class="p">Pick a category or enter a custom topic</text><rect x="40" y="190" width="170" height="95" rx="10" fill="#EFF6FF" stroke="${accent}"/><text x="60" y="228" class="b">Technology</text><text x="60" y="252" class="p">AI, web dev, CS</text><rect x="230" y="190" width="170" height="95" rx="10" fill="#F0FDFA" stroke="#19A7A0"/><text x="250" y="228" class="b">Science &amp; Nature</text><text x="250" y="252" class="p">Physics, biology</text><rect x="40" y="320" width="360" height="42" rx="8" fill="#F7F9FC" stroke="#D8E1EA"/><text x="58" y="347" class="p">Custom topic: __________________</text>`
    : kind === 'quiz'
      ? `<rect x="40" y="115" width="360" height="42" rx="8" fill="#FFF4EE"/><text x="60" y="142" class="b" fill="${accent}">TECHNOLOGY  |  MEDIUM  |  SCORE 1/5</text><text x="40" y="205" class="h">Which choice best describes a REST API?</text><rect x="40" y="238" width="360" height="43" rx="8" fill="#FFFFFF" stroke="#D8E1EA"/><circle cx="63" cy="260" r="12" fill="#F7B84B"/><text x="58" y="265" class="b">A</text><text x="88" y="265" class="p">A browser extension</text><rect x="40" y="295" width="360" height="43" rx="8" fill="#FFFFFF" stroke="#D8E1EA"/><circle cx="63" cy="317" r="12" fill="#F7B84B"/><text x="58" y="322" class="b">B</text><text x="88" y="322" class="p">A web service interface</text><rect x="40" y="360" width="360" height="12" rx="6" fill="#EAF0F6"/><rect x="40" y="360" width="145" height="12" rx="6" fill="${accent}"/>`
      : `<circle cx="220" cy="155" r="48" fill="#E6FFFA" stroke="${accent}" stroke-width="3"/><text x="190" y="165" class="score">80%</text><text x="40" y="255" class="h">Great work, Explorer!</text><text x="40" y="285" class="p">You earned 2 stars and 400 XP</text><rect x="40" y="320" width="360" height="42" rx="8" fill="#F0FDFA" stroke="#19A7A0"/><text x="60" y="347" class="b">Result saved to profile history</text>`;
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="450" viewBox="0 0 440 450"><rect width="440" height="450" rx="18" fill="#FFFFFF"/><rect width="440" height="60" rx="18" fill="#132238"/><rect y="42" width="440" height="18" fill="#132238"/><circle cx="34" cy="30" r="15" fill="#F36F3D"/><text x="60" y="36" class="brand">Quiz-A-Roo</text><text x="40" y="94" class="p">Explorer dashboard  /  ${esc(title)}</text>${content}<style>.brand{font:700 18px Arial;fill:white}.h{font:700 20px Arial;fill:#132238}.p{font:14px Arial;fill:#617083}.b{font:700 14px Arial;fill:#243447}.score{font:700 23px Arial;fill:#19A7A0}</style></svg>`);
}

// 1. Cover
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 7.5, fill: { color: C.navy }, line: { color: C.navy } });
  s.addShape(pptx.ShapeType.arc, { x: 8.6, y: -1.1, w: 5.5, h: 5.5, adjustPoint: 0.25, line: { color: C.orange, width: 20, transparency: 5 } });
  s.addShape(pptx.ShapeType.arc, { x: 9.6, y: 3.9, w: 4.2, h: 4.2, adjustPoint: 0.25, line: { color: C.yellow, width: 8, transparency: 10 } });
  addText(s, 'QUIZ-A-ROO', 0.78, 1.2, 6, 0.35, { fontSize: 15, bold: true, color: C.yellow });
  addText(s, 'Project Documentation', 0.78, 1.75, 8.4, 0.8, { fontSize: 38, bold: true, color: C.white, fontFace: 'Aptos Display' });
  addText(s, 'Requirements, UML models, workflow, architecture, and interface evidence', 0.82, 2.75, 7.3, 0.55, { fontSize: 17, color: 'DCE6F0', valign: 'top' });
  pill(s, 'AI-POWERED ADAPTIVE QUIZ PLATFORM', 0.82, 3.65, 3.2, C.orange);
  addText(s, 'React  •  Express  •  Supabase  •  Vercel', 0.82, 4.18, 5.6, 0.3, { fontSize: 12, color: 'B9C7D8' });
  addText(s, 'Prepared for project review', 0.82, 6.35, 4, 0.25, { fontSize: 10, color: '91A4B8' });
  addNotes(s, 'Opening slide for the expanded project documentation deck.');
}

// 2. Contents
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'What this deck adds', 'Expanded documentation');
  const items = [['01', 'Requirements', 'Functional and non-functional expectations'], ['02', 'UML models', 'Use case, activity, sequence, and architecture'], ['03', 'Workflow', 'End-to-end quiz journey and decision points'], ['04', 'Evidence', 'Representative UI screenshots and implementation details']];
  items.forEach((it, i) => { const y = 1.45 + i * 1.17; s.addShape(pptx.ShapeType.ellipse, { x: 0.72, y, w: 0.55, h: 0.55, fill: { color: i % 2 ? C.teal : C.orange }, line: { color: i % 2 ? C.teal : C.orange } }); addText(s, it[0], 0.72, y + 0.13, 0.55, 0.22, { fontSize: 10, bold: true, color: C.white, align: 'center' }); addText(s, it[1], 1.55, y - 0.02, 3.3, 0.3, { fontSize: 18, bold: true, color: C.navy }); addText(s, it[2], 1.55, y + 0.36, 6, 0.24, { fontSize: 11, color: C.muted }); });
  box(s, 8.45, 1.45, 3.95, 4.9, 'EEF5F8', 'D6E5EA'); addText(s, 'Design principle', 8.8, 1.85, 3, 0.3, { fontSize: 13, bold: true, color: C.teal }); addText(s, 'Every model maps to a concrete route, component, API call, or persistence action in the implementation.', 8.8, 2.35, 3.05, 1.25, { fontSize: 20, bold: true, color: C.navy, valign: 'top' }); pill(s, 'TRACEABLE', 8.8, 4.25, 1.22, C.teal); pill(s, 'PRACTICAL', 10.18, 4.25, 1.35, C.orange); addText(s, 'The diagrams are documentation of the product as built, not abstract placeholders.', 8.8, 4.85, 3.05, 0.8, { fontSize: 11, color: C.muted, valign: 'top' });
}

// 3. Functional requirements
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Functional requirements', 'Requirements');
  const rows = [['ID', 'Requirement', 'Acceptance evidence'], ['FR-01', 'Register and log in with Explorer Name + Secret Explorer ID.', 'Home page calls register/login API and stores identity locally.'], ['FR-02', 'Select a featured or custom topic.', 'SelectTopic routes the chosen topic into quiz setup.'], ['FR-03', 'Choose difficulty and quiz mode.', 'SelectDifficulty supports Easy, Medium, Hard and code/theory modes.'], ['FR-04', 'Generate multiple-choice questions on demand.', 'Quiz invokes generateQuiz and renders question options with progress.'], ['FR-05', 'Provide fallback questions when AI generation fails.', 'Backend retries providers and falls back to a local question bank.'], ['FR-06', 'Score answers and show immediate feedback.', 'Quiz tracks score, streak, timer, correct/wrong state, and XP.'], ['FR-07', 'Persist results and update progression.', 'Results saves stars/XP to local progress and Supabase.'], ['FR-08', 'Expose history and global leaderboard views.', 'History and Leaderboard routes read persisted player data.']];
  s.addTable(rows, { x: 0.55, y: 1.25, w: 12.25, h: 5.55, border: { type: 'solid', pt: 0.7, color: C.line }, fill: C.white, color: C.ink, fontFace: 'Aptos', fontSize: 9, margin: 0.08, rowH: 0.56, colW: [0.72, 5.05, 6.48], bold: false, autoFit: false, valign: 'mid', breakLine: false, align: 'left' });
  rows.slice(1).forEach((_, i) => { if (i % 2 === 0) s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.25 + 0.56 * (i + 1), w: 12.25, h: 0.56, fill: { color: 'F4F7FA', transparency: 8 }, line: { color: 'F4F7FA', transparency: 100 } }); });
  addNotes(s, 'Functional requirements are derived from the implemented React routes, API helpers, quiz state, and results persistence.');
}

// 4. Non-functional requirements
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Non-functional requirements', 'Requirements');
  card(s, 0.65, 1.35, 3.85, 1.45, 'NFR-01  Availability', 'The user can complete a quiz even when live AI providers fail, using retry logic and a fallback bank.', C.teal);
  card(s, 4.75, 1.35, 3.85, 1.45, 'NFR-02  Performance', 'Quiz generation is bounded by a timeout so slow providers do not leave the interface waiting indefinitely.', C.orange);
  card(s, 8.85, 1.35, 3.85, 1.45, 'NFR-03  Usability', 'Clear topic, difficulty, progress, timer, feedback, and result states support fast scanning.', C.blue);
  card(s, 0.65, 3.15, 3.85, 1.45, 'NFR-04  Security', 'The Secret Explorer ID avoids password storage while keeping a player identity available across sessions.', C.red);
  card(s, 4.75, 3.15, 3.85, 1.45, 'NFR-05  Maintainability', 'React pages separate route-level views; API helpers isolate server communication from presentation.', C.green);
  card(s, 8.85, 3.15, 3.85, 1.45, 'NFR-06  Scalability', 'Multiple AI providers and structured JSON responses allow the generation layer to evolve independently.', C.yellow);
  box(s, 0.65, 5.15, 12.05, 1.12, 'FFF8E8', 'F7D99A'); addText(s, 'Quality target', 0.95, 5.43, 1.3, 0.2, { fontSize: 11, bold: true, color: '9A6A00' }); addText(s, 'A player should always receive a clear next state: loading, question, feedback, results, or a recoverable error.', 2.4, 5.35, 9.55, 0.35, { fontSize: 16, bold: true, color: C.navy });
}

// 5. Use case
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Use case diagram', 'UML');
  s.addShape(pptx.ShapeType.ellipse, { x: 0.7, y: 2.55, w: 0.45, h: 0.45, fill: { color: C.navy }, line: { color: C.navy } }); s.addShape(pptx.ShapeType.line, { x: 0.925, y: 3.0, w: 0, h: 0.72, line: { color: C.navy, width: 2 } }); s.addShape(pptx.ShapeType.line, { x: 0.925, y: 3.26, w: -0.35, h: 0.35, line: { color: C.navy, width: 2 } }); s.addShape(pptx.ShapeType.line, { x: 0.925, y: 3.26, w: 0.35, h: 0.35, line: { color: C.navy, width: 2 } }); s.addShape(pptx.ShapeType.line, { x: 0.925, y: 3.72, w: -0.25, h: 0.42, line: { color: C.navy, width: 2 } }); s.addShape(pptx.ShapeType.line, { x: 0.925, y: 3.72, w: 0.25, h: 0.42, line: { color: C.navy, width: 2 } }); addText(s, 'Explorer', 0.48, 4.35, 0.9, 0.25, { fontSize: 12, bold: true, color: C.navy, align: 'center' });
  box(s, 2.0, 1.25, 9.95, 5.2, 'FDFEFF', C.blue); addText(s, 'Quiz-A-Roo system', 2.3, 1.48, 2.5, 0.25, { fontSize: 12, bold: true, color: C.blue });
  const useCases = [['Register / Login', 2.55, 2.15, C.orange], ['Choose topic', 5.0, 2.15, C.teal], ['Choose difficulty', 7.45, 2.15, C.yellow], ['Play quiz', 2.55, 3.55, C.blue], ['View results', 5.0, 3.55, C.green], ['Review history', 7.45, 3.55, C.red], ['View leaderboard', 5.0, 5.0, C.navy]];
  useCases.forEach(([label, x, y, color]) => { s.addShape(pptx.ShapeType.ellipse, { x, y, w: 1.95, h: 0.72, fill: { color: 'FFFFFF' }, line: { color, width: 1.5 } }); addText(s, label, x + 0.1, y + 0.22, 1.75, 0.22, { fontSize: 10, bold: true, color: C.ink, align: 'center' }); arrow(s, 1.15, 3.42, x, y + 0.36, C.muted, 0.8); });
  node(s, 'AI provider / fallback bank', 9.55, 5.0, 1.8, 0.72, 'FFF4EE', C.orange); arrow(s, 9.4, 4.05, 10.45, 5.0, C.orange, 1); addText(s, 'External services', 10.0, 5.85, 1.4, 0.22, { fontSize: 9, color: C.muted, align: 'center' });
}

// 6. Activity/workflow
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Activity diagram: quiz workflow', 'UML + workflow');
  const x = 5.05; s.addShape(pptx.ShapeType.ellipse, { x: x + 0.43, y: 1.08, w: 0.38, h: 0.38, fill: { color: C.navy }, line: { color: C.navy } });
  node(s, 'Open app', x, 1.62, 1.3, 0.48, 'EAF0F6', C.navy); arrow(s, x + 0.65, 1.46, x + 0.65, 1.62, C.navy);
  node(s, 'Register / login', x, 2.35, 1.3, 0.48, 'FFF4EE', C.orange); arrow(s, x + 0.65, 2.1, x + 0.65, 2.35, C.navy);
  node(s, 'Select topic', x, 3.08, 1.3, 0.48, 'EEF9F8', C.teal); arrow(s, x + 0.65, 2.83, x + 0.65, 3.08, C.navy);
  node(s, 'Select difficulty', x, 3.81, 1.3, 0.48, 'FFF8E8', C.yellow); arrow(s, x + 0.65, 3.56, x + 0.65, 3.81, C.navy);
  node(s, 'Generate quiz', x, 4.54, 1.3, 0.48, 'EEF5FF', C.blue); arrow(s, x + 0.65, 4.29, x + 0.65, 4.54, C.navy);
  s.addShape(pptx.ShapeType.diamond, { x: x + 0.35, y: 5.28, w: 0.6, h: 0.6, fill: { color: 'FFFFFF' }, line: { color: C.orange, width: 1.4 } }); addText(s, 'AI\nready?', x + 0.39, 5.39, 0.52, 0.35, { fontSize: 8, bold: true, color: C.ink, align: 'center' }); arrow(s, x + 0.65, 5.02, x + 0.65, 5.28, C.navy);
  node(s, 'Render questions', 2.0, 5.65, 1.65, 0.48, 'EEF9F8', C.teal); arrow(s, x + 0.35, 5.58, 3.65, 5.88, C.teal); addText(s, 'yes', 3.3, 5.48, 0.35, 0.18, { fontSize: 9, color: C.teal, bold: true });
  node(s, 'Use fallback bank', 8.45, 5.65, 1.65, 0.48, 'FFF4EE', C.orange); arrow(s, x + 0.95, 5.58, 8.45, 5.88, C.orange); addText(s, 'no', 7.35, 5.48, 0.35, 0.18, { fontSize: 9, color: C.orange, bold: true });
  node(s, 'Answer loop → score → results → save', 4.15, 6.45, 3.1, 0.48, C.navy, C.navy, C.white); arrow(s, 2.82, 6.13, 4.65, 6.45, C.navy); arrow(s, 9.28, 6.13, 7.0, 6.45, C.navy);
}

// 7. Sequence
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Sequence diagram: generate and save a quiz', 'UML');
  const actors = [['Explorer', 1.05, C.orange], ['React UI', 3.35, C.blue], ['Express API', 5.65, C.teal], ['AI provider', 7.95, C.yellow], ['Supabase', 10.25, C.green]];
  actors.forEach(([name, x, color]) => { node(s, name, x, 1.18, 1.28, 0.48, color, color, C.white); s.addShape(pptx.ShapeType.line, { x: x + 0.64, y: 1.68, w: 0, h: 4.7, line: { color: 'B8C5D1', width: 1, dash: 'dash' } }); });
  const msgs = [['1. submit topic + difficulty', 1.7, 3.35, C.orange], ['2. POST /api/generate-quiz', 3.95, 5.65, C.blue], ['3. generate structured JSON', 6.25, 7.95, C.teal], ['4. return questions or fallback', 7.95, 5.65, C.orange], ['5. render quiz + collect answers', 5.65, 3.35, C.blue], ['6. POST result / update progress', 3.35, 10.25, C.teal], ['7. confirm saved result', 10.25, 3.35, C.green]];
  msgs.forEach(([label, y, from, to, color]) => { const x1 = from + 0.64; const x2 = to + 0.64; arrow(s, x1, y, x2, y, color, 1.2); addText(s, label, Math.min(x1, x2), y - 0.22, Math.abs(x2 - x1), 0.2, { fontSize: 8, color: C.muted, align: 'center' }); });
  box(s, 0.82, 6.62, 11.75, 0.4, 'F4F7FA', 'F4F7FA'); addText(s, 'Key resilience point: if the AI provider fails or times out, Express returns fallback questions and the player journey continues.', 1.05, 6.72, 11.2, 0.18, { fontSize: 10, bold: true, color: C.navy, align: 'center' });
}

// 8. Architecture UML
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Component / architecture UML', 'UML');
  node(s, 'React client\nRoutes + pages', 0.75, 2.45, 2.0, 1.0, 'EEF5FF', C.blue); node(s, 'API helper\nfetch wrapper', 3.45, 2.45, 2.0, 1.0, 'EEF9F8', C.teal); node(s, 'Express server\n/routes/quiz.js', 6.15, 2.45, 2.0, 1.0, 'FFF4EE', C.orange); node(s, 'Question engine\nLLM + fallback', 8.85, 1.45, 2.0, 1.0, 'FFF8E8', C.yellow); node(s, 'Supabase\nusers + results', 8.85, 3.45, 2.0, 1.0, 'EEF9F1', C.green);
  arrow(s, 2.75, 2.95, 3.45, 2.95, C.blue); arrow(s, 5.45, 2.95, 6.15, 2.95, C.teal); arrow(s, 8.15, 2.75, 8.85, 1.95, C.orange); arrow(s, 8.15, 3.15, 8.85, 3.95, C.orange); addText(s, 'HTTP / JSON', 2.82, 2.65, 0.65, 0.18, { fontSize: 8, color: C.muted, align: 'center' }); addText(s, 'REST calls', 5.55, 2.65, 0.6, 0.18, { fontSize: 8, color: C.muted, align: 'center' });
  box(s, 2.1, 5.2, 8.95, 0.85, C.navy, C.navy); addText(s, 'Cross-cutting qualities: timeout protection  •  structured JSON  •  local progress  •  graceful fallback', 2.35, 5.48, 8.45, 0.25, { fontSize: 13, bold: true, color: C.white, align: 'center' });
  addText(s, 'Frontend', 1.25, 3.72, 0.9, 0.2, { fontSize: 10, bold: true, color: C.blue, align: 'center' }); addText(s, 'Integration', 3.95, 3.72, 0.9, 0.2, { fontSize: 10, bold: true, color: C.teal, align: 'center' }); addText(s, 'Backend', 6.65, 3.72, 0.9, 0.2, { fontSize: 10, bold: true, color: C.orange, align: 'center' }); addText(s, 'Services', 9.35, 5.0, 0.9, 0.2, { fontSize: 10, bold: true, color: C.green, align: 'center' });
}

// 9. Screenshots
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Interface evidence', 'Screenshots');
  s.addImage({ data: screenshotSvg('topic'), x: 0.6, y: 1.35, w: 3.9, h: 4.0 }); s.addImage({ data: screenshotSvg('quiz'), x: 4.72, y: 1.35, w: 3.9, h: 4.0 }); s.addImage({ data: screenshotSvg('results'), x: 8.84, y: 1.35, w: 3.9, h: 4.0 });
  addText(s, 'Topic selection', 0.6, 5.55, 3.9, 0.28, { fontSize: 13, bold: true, color: C.navy, align: 'center' }); addText(s, 'Live quiz state', 4.72, 5.55, 3.9, 0.28, { fontSize: 13, bold: true, color: C.navy, align: 'center' }); addText(s, 'Score and persistence', 8.84, 5.55, 3.9, 0.28, { fontSize: 13, bold: true, color: C.navy, align: 'center' }); addText(s, 'Representative screen captures rendered from the implemented UI states.', 2.55, 6.25, 8.3, 0.24, { fontSize: 10, color: C.muted, align: 'center' });
}

// 10. Implementation details
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Implementation details', 'Technical notes');
  card(s, 0.7, 1.35, 3.8, 1.3, 'Routing', '`App.js` maps Home, Roadmap, SelectTopic, SelectDifficulty, Quiz, Results, History, and Leaderboard into the player journey.', C.blue);
  card(s, 4.78, 1.35, 3.8, 1.3, 'State', 'Route state carries topic, difficulty, mode, stage, and player identity between screens; localStorage preserves identity and stage progress.', C.teal);
  card(s, 8.86, 1.35, 3.8, 1.3, 'Generation', 'The quiz API accepts topic, difficulty, question count, and mode, then returns normalized multiple-choice data.', C.orange);
  card(s, 0.7, 3.15, 3.8, 1.3, 'Scoring', 'Answers update score, streak, progress, timer, feedback state, stars, and XP before navigating to Results.', C.yellow);
  card(s, 4.78, 3.15, 3.8, 1.3, 'Persistence', 'Results updates local roadmap progress and calls the result-save API for history and leaderboard data.', C.green);
  card(s, 8.86, 3.15, 3.8, 1.3, 'Recovery', 'Loading, empty, failed-sync, and fallback states keep the player informed and provide a next action.', C.red);
  box(s, 0.7, 5.25, 11.96, 0.85, 'F4F7FA', C.line); addText(s, 'Primary traceability chain', 1.0, 5.48, 1.9, 0.2, { fontSize: 10, bold: true, color: C.muted }); addText(s, 'Route → component state → API call → persistence → next visible state', 3.05, 5.43, 8.95, 0.3, { fontSize: 16, bold: true, color: C.navy, align: 'center' });
}

// 11. Risk / test matrix
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Verification checklist', 'Quality');
  const rows = [['Area', 'Check', 'Expected outcome'], ['Authentication', 'Register, reload, login with Secret Explorer ID', 'Identity and stage progress are restored'], ['Generation', 'Valid AI response / provider timeout / malformed response', 'Questions render or fallback is returned'], ['Quiz loop', 'Select answer, reveal feedback, advance through final question', 'Score, streak, progress, and timer remain consistent'], ['Results', 'Complete quiz with a logged-in player', 'Stars/XP appear and result is saved'], ['Navigation', 'Open protected setup route without player identity', 'Clear recovery state sends player to Home'], ['Responsive UI', 'View topic, quiz, and results at mobile width', 'Controls remain readable and usable']];
  s.addTable(rows, { x: 0.7, y: 1.45, w: 11.95, h: 4.5, border: { type: 'solid', pt: 0.7, color: C.line }, fill: C.white, color: C.ink, fontSize: 10, margin: 0.1, rowH: 0.65, colW: [1.6, 5.0, 5.35], valign: 'mid', autoFit: false });
  box(s, 0.7, 6.25, 11.95, 0.55, 'EEF9F8', 'B8E5DF'); addText(s, 'Definition of done: every primary user path has a visible success state and a recoverable failure state.', 1.0, 6.41, 11.35, 0.2, { fontSize: 12, bold: true, color: C.teal, align: 'center' });
}

// 12. Close
{
  const s = pptx.addSlide('MASTER'); s.background = { color: C.navy }; s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 7.5, fill: { color: C.navy }, line: { color: C.navy } }); s.addShape(pptx.ShapeType.arc, { x: -1.4, y: 4.6, w: 4.8, h: 4.8, adjustPoint: 0.2, line: { color: C.teal, width: 14, transparency: 8 } }); s.addShape(pptx.ShapeType.arc, { x: 9.6, y: -1.5, w: 4.8, h: 4.8, adjustPoint: 0.2, line: { color: C.orange, width: 14, transparency: 8 } }); addText(s, 'Quiz-A-Roo', 0.82, 2.1, 6.5, 0.55, { fontSize: 36, bold: true, color: C.white, fontFace: 'Aptos Display' }); addText(s, 'A documented, traceable path from player intent to adaptive learning feedback.', 0.85, 3.05, 7.7, 0.7, { fontSize: 19, color: 'DCE6F0', valign: 'top' }); pill(s, 'QUESTIONS  •  PROGRESS  •  COMPETITION', 0.85, 4.25, 3.45, C.orange); addText(s, 'Thank you', 0.85, 6.1, 2, 0.25, { fontSize: 13, color: C.yellow, bold: true });
}

// 13. Combined source materials: product value and feature set
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Product story and core features', 'Combined source materials');
  addText(s, 'Quiz-A-Roo turns a conventional quiz into a repeatable learning loop: choose a subject, receive fresh questions, get immediate feedback, and see progress accumulate.', 0.75, 1.28, 11.8, 0.55, { fontSize: 17, color: C.navy, bold: true, valign: 'top' });
  card(s, 0.75, 2.2, 3.75, 1.35, 'Fresh content', 'AI-generated questions can adapt to any topic and difficulty, avoiding a fixed question list.', C.orange);
  card(s, 4.8, 2.2, 3.75, 1.35, 'Game mechanics', 'XP, stars, unlockable stages, streaks, and a leaderboard turn practice into visible progress.', C.yellow);
  card(s, 8.85, 2.2, 3.75, 1.35, 'Always available', 'Fallback questions keep the learning flow usable when an external AI provider is unavailable.', C.teal);
  box(s, 0.75, 4.15, 11.85, 1.45, 'F4F7FA', C.line); addText(s, 'Core loop', 1.05, 4.48, 1.25, 0.22, { fontSize: 11, bold: true, color: C.muted }); const loop = [['Choose', 2.35, C.blue], ['Generate', 4.25, C.orange], ['Answer', 6.15, C.teal], ['Score', 8.05, C.yellow], ['Improve', 9.95, C.green]]; loop.forEach(([label, x, color], i) => { pill(s, label, x, 4.46, 1.15, color); if (i < loop.length - 1) arrow(s, x + 1.2, 4.6, x + 1.82, 4.6, C.muted, 1); });
  addText(s, 'Value proposition: personalized practice with the clarity and motivation of a game.', 1.05, 5.98, 11.1, 0.28, { fontSize: 13, color: C.navy, bold: true, align: 'center' });
}

// 14. Combined source materials: AI integration
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'AI integration and resilience', 'Combined source materials');
  node(s, 'Quiz request', 0.85, 2.2, 1.55, 0.7, 'EEF5FF', C.blue); node(s, 'Provider selection', 3.05, 2.2, 1.75, 0.7, 'FFF4EE', C.orange); node(s, 'Structured JSON', 5.5, 2.2, 1.75, 0.7, 'EEF9F8', C.teal); node(s, 'Question validation', 7.95, 2.2, 1.75, 0.7, 'FFF8E8', C.yellow); node(s, 'Render or fallback', 10.4, 2.2, 1.75, 0.7, 'EEF9F1', C.green);
  arrow(s, 2.4, 2.55, 3.05, 2.55, C.blue); arrow(s, 4.8, 2.55, 5.5, 2.55, C.orange); arrow(s, 7.25, 2.55, 7.95, 2.55, C.teal); arrow(s, 9.7, 2.55, 10.4, 2.55, C.yellow);
  card(s, 0.85, 4.05, 3.55, 1.35, 'Provider flexibility', 'Multiple AI services can be selected and switched without changing the React quiz interface.', C.blue);
  card(s, 4.9, 4.05, 3.55, 1.35, 'Timeout protection', 'A bounded generation request prevents slow external services from blocking the player indefinitely.', C.orange);
  card(s, 8.95, 4.05, 3.55, 1.35, 'Fallback continuity', 'A local question bank preserves the essential promise: the player can still take a quiz.', C.teal);
  box(s, 1.25, 6.15, 10.85, 0.48, C.navy, C.navy); addText(s, 'External intelligence is an enhancement; the core learning workflow remains resilient.', 1.55, 6.29, 10.25, 0.18, { fontSize: 12, bold: true, color: C.white, align: 'center' });
}

// 15. Combined source materials: competition and progression
{
  const s = pptx.addSlide('MASTER'); addTitle(s, 'Progression, history, and competition', 'Combined source materials');
  const stages = [['Topic', 'Technology'], ['Level', 'Medium Explorer'], ['Result', '2 stars'], ['Reward', '400 XP'], ['Record', 'History + leaderboard']];
  stages.forEach(([label, value], i) => { const x = 0.85 + i * 2.42; s.addShape(pptx.ShapeType.ellipse, { x, y: 2.05, w: 0.7, h: 0.7, fill: { color: [C.blue, C.orange, C.yellow, C.teal, C.green][i] }, line: { color: [C.blue, C.orange, C.yellow, C.teal, C.green][i] } }); addText(s, String(i + 1), x, 2.27, 0.7, 0.2, { fontSize: 12, bold: true, color: C.white, align: 'center' }); if (i < stages.length - 1) arrow(s, x + 0.78, 2.4, x + 2.2, 2.4, C.muted, 1.2); addText(s, label, x - 0.35, 3.05, 1.4, 0.2, { fontSize: 11, bold: true, color: C.navy, align: 'center' }); addText(s, value, x - 0.55, 3.38, 1.8, 0.36, { fontSize: 10, color: C.muted, align: 'center' }); });
  box(s, 0.85, 4.45, 5.65, 1.38, 'EEF9F8', 'B8E5DF'); addText(s, 'Player history', 1.15, 4.75, 1.65, 0.25, { fontSize: 15, bold: true, color: C.teal }); addText(s, 'Completed quizzes, topics, scores, XP, and stars create a personal learning record.', 1.15, 5.15, 4.9, 0.35, { fontSize: 11, color: C.ink, valign: 'top' });
  box(s, 6.85, 4.45, 5.65, 1.38, 'FFF4EE', 'F2C1B4'); addText(s, 'Global leaderboard', 7.15, 4.75, 2.1, 0.25, { fontSize: 15, bold: true, color: C.orange }); addText(s, 'XP rankings make progress social while the Secret Explorer ID keeps the login experience lightweight.', 7.15, 5.15, 4.9, 0.35, { fontSize: 11, color: C.ink, valign: 'top' });
}

pptx.writeFile({ fileName: 'Quiz-A-Roo (1)-project-aligned-updated.pptx' }).then(() => pptx.writeFile({ fileName: 'Final.pptx' })).then(() => fs.copyFileSync('Final.pptx', 'Final.ppt')).catch(err => { console.error(err); process.exitCode = 1; });
