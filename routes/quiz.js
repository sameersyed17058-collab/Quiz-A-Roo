const express = require('express');
const router = express.Router();

const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
const IS_GROQ_KEY = OPENAI_KEY.startsWith('gsk_');
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || (IS_GROQ_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');

// Active and verified Groq / OpenAI models
const GROQ_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-120b'];
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

const DEFAULT_MODEL =
  process.env.OPENAI_MODEL?.trim() || (IS_GROQ_KEY ? 'openai/gpt-oss-20b' : 'gpt-4o-mini');

const MODEL_FALLBACKS = Array.from(
  new Set([DEFAULT_MODEL, ...(IS_GROQ_KEY ? GROQ_MODELS : OPENAI_MODELS)].filter(Boolean))
);

const DEMO_KEYS = new Set(['demo-key-not-real', 'demo-key', 'test-key', '']);
const useFallback = !OPENAI_KEY || DEMO_KEYS.has(OPENAI_KEY);

// Helper: Fisher-Yates shuffle an array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Server-side randomizer: ensures options are shuffled and answerIndex is distributed across 0, 1, 2, 3
function formatAndRandomizeQuestions(rawQuestions) {
  return rawQuestions.map((q, idx) => {
    let options = Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'];
    let originalAnswerIndex = typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < options.length
      ? q.answerIndex
      : 0;

    const correctAnswerText = options[originalAnswerIndex];

    // Shuffle options to guarantee no bias toward option A
    const shuffledOptions = shuffleArray(options);
    const newAnswerIndex = shuffledOptions.indexOf(correctAnswerText);

    return {
      id: q.id || idx + 1,
      question: String(q.question || `Question ${idx + 1}`).trim(),
      options: shuffledOptions.map((opt) => String(opt).trim()),
      answerIndex: newAnswerIndex >= 0 ? newAnswerIndex : 0
    };
  });
}

// Comprehensive Curated Trivia Bank for Fallback & Variety
const CURATED_TRIVIA_BANK = [
  // General Knowledge - Easy
  { topic: 'General Knowledge', difficulty: 'easy', question: 'How many days are in a leap year?', options: ['366', '365', '364', '360'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'easy', question: 'Which planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Mercury'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'easy', question: 'What is the largest ocean on Earth?', options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'easy', question: 'Which instrument has 88 keys?', options: ['Piano', 'Guitar', 'Violin', 'Flute'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'easy', question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'O2', 'NaCl'], answerIndex: 0 },

  // General Knowledge - Medium
  { topic: 'General Knowledge', difficulty: 'medium', question: 'What is the rarest blood type in human populations?', options: ['AB negative', 'O positive', 'B positive', 'A negative'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'medium', question: 'Which country invented the modern printing press around 1440?', options: ['Germany', 'France', 'Italy', 'England'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'medium', question: 'What is the hottest recorded temperature layer in the Earth atmosphere?', options: ['Thermosphere', 'Troposphere', 'Stratosphere', 'Mesosphere'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'medium', question: 'In architecture, what does the term "keystone" refer to?', options: ['The central wedge-shaped stone at the top of an arch', 'The foundation stone of a tower', 'The decorative column capital', 'The mortar between bricks'], answerIndex: 0 },

  // General Knowledge - Hard
  { topic: 'General Knowledge', difficulty: 'hard', question: 'What is the only element on the periodic table named after a living person at the time of discovery (aside from Seaborgium)?', options: ['Oganesson', 'Copernicium', 'Flerovium', 'Meitnerium'], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'hard', question: 'What mathematical paradox states that an infinite hotel with all rooms occupied can still accommodate new guests?', options: ["Hilbert's Paradox of the Grand Hotel", "Russell's Paradox", "Zeno's Dichotomy", "Banach-Tarski Paradox"], answerIndex: 0 },
  { topic: 'General Knowledge', difficulty: 'hard', question: 'Which treaty ended the Thirty Years War in 1648 and established modern state sovereignty?', options: ['Peace of Westphalia', 'Treaty of Utrecht', 'Treaty of Tordesillas', 'Treaty of Versailles'], answerIndex: 0 },

  // Science & Nature - Easy
  { topic: 'Science & Nature', difficulty: 'easy', question: 'What gas do plants absorb from the atmosphere during photosynthesis?', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'easy', question: 'What is the powerhouse of the biological cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Endoplasmic reticulum'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'easy', question: 'How many legs does an arachnid (spider) have?', options: ['8', '6', '10', '12'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'easy', question: 'Which is the fastest land animal on Earth?', options: ['Cheetah', 'Pronghorn', 'Lion', 'Greyhound'], answerIndex: 0 },

  // Science & Nature - Medium
  { topic: 'Science & Nature', difficulty: 'medium', question: 'What is the primary constituent of the Earth outer core?', options: ['Liquid iron and nickel', 'Solid basalt', 'Molten silicon', 'Granite rock'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'medium', question: 'Which subatomic particle carries no electrical charge?', options: ['Neutron', 'Proton', 'Electron', 'Positron'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'medium', question: 'What type of cloud is typically responsible for thunderstorms and hail?', options: ['Cumulonimbus', 'Cirrus', 'Stratus', 'Altocumulus'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'medium', question: 'In optics, what phenomenon describes the bending of light as it passes between different media?', options: ['Refraction', 'Diffraction', 'Reflection', 'Dispersion'], answerIndex: 0 },

  // Science & Nature - Hard
  { topic: 'Science & Nature', difficulty: 'hard', question: 'What is the theoretical boundary around a black hole beyond which nothing can escape?', options: ['Event Horizon', 'Photon Sphere', 'Ergosphere', 'Singularity Core'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'hard', question: 'Which enzyme is responsible for synthesizing mRNA from a DNA template during transcription?', options: ['RNA Polymerase II', 'DNA Ligase', 'Helicase', 'Topoisomerase'], answerIndex: 0 },
  { topic: 'Science & Nature', difficulty: 'hard', question: 'What is the name of the quantum phenomenon where particles remain correlated across infinite distances?', options: ['Quantum Entanglement', 'Quantum Tunneling', 'Superposition', 'Wavefunction Collapse'], answerIndex: 0 },

  // Pop Culture - Easy
  { topic: 'Pop Culture', difficulty: 'easy', question: 'Who is the famous wizard in the fantasy series with a lightning bolt scar?', options: ['Harry Potter', 'Gandalf', 'Percy Jackson', 'Doctor Strange'], answerIndex: 0 },
  { topic: 'Pop Culture', difficulty: 'easy', question: 'Which superhero is known as the "Caped Crusader" protecting Gotham City?', options: ['Batman', 'Superman', 'Spider-Man', 'Iron Man'], answerIndex: 0 },
  { topic: 'Pop Culture', difficulty: 'easy', question: 'What video game features a green-capped hero named Link rescuing Princess Zelda?', options: ['The Legend of Zelda', 'Super Mario', 'Pokemon', 'Metroid'], answerIndex: 0 },

  // Pop Culture - Medium
  { topic: 'Pop Culture', difficulty: 'medium', question: 'Which movie won the first-ever Academy Award for Best Animated Feature in 2002?', options: ['Shrek', 'Monsters, Inc.', 'Toy Story 2', 'Finding Nemo'], answerIndex: 0 },
  { topic: 'Pop Culture', difficulty: 'medium', question: 'What is the fictional kingdom where the main events of HBO Game of Thrones take place?', options: ['Westeros', 'Middle-earth', 'Narnia', 'Azeroth'], answerIndex: 0 },
  { topic: 'Pop Culture', difficulty: 'medium', question: 'Which legendary band recorded the iconic album "Abbey Road" in 1969?', options: ['The Beatles', 'The Rolling Stones', 'Pink Floyd', 'Led Zeppelin'], answerIndex: 0 },

  // Pop Culture - Hard
  { topic: 'Pop Culture', difficulty: 'hard', question: 'What was the first feature-length anime film ever created, released in Japan in 1945?', options: ["Momotaro: Sacred Sailors", "Astro Boy", "Akira", "Panda and the Magic Serpent"], answerIndex: 0 },
  { topic: 'Pop Culture', difficulty: 'hard', question: 'In the original 1977 Star Wars, who was the physical actor inside the Darth Vader suit during filming?', options: ['David Prowse', 'James Earl Jones', 'Peter Cushing', 'Sebastian Shaw'], answerIndex: 0 },

  // History - Easy
  { topic: 'History', difficulty: 'easy', question: 'Who was the first President of the United States?', options: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'], answerIndex: 0 },
  { topic: 'History', difficulty: 'easy', question: 'Which ancient civilization built the Great Pyramids of Giza?', options: ['Ancient Egyptians', 'Romans', 'Greeks', 'Mesopotamians'], answerIndex: 0 },
  { topic: 'History', difficulty: 'easy', question: 'In what year did the Titanic sink in the North Atlantic?', options: ['1912', '1905', '1920', '1898'], answerIndex: 0 },

  // History - Medium
  { topic: 'History', difficulty: 'medium', question: 'Which ancient trade route linked China and the Mediterranean across Central Asia?', options: ['The Silk Road', 'The Amber Road', 'The Spice Route', 'The Royal Road'], answerIndex: 0 },
  { topic: 'History', difficulty: 'medium', question: 'Who was the female pharaoh of Egypt who built the famous temple at Deir el-Bahari?', options: ['Hatshepsut', 'Cleopatra VII', 'Nefertiti', 'Sobekneferu'], answerIndex: 0 },
  { topic: 'History', difficulty: 'medium', question: 'What year marked the fall of the Berlin Wall?', options: ['1989', '1991', '1985', '1979'], answerIndex: 0 },

  // History - Hard
  { topic: 'History', difficulty: 'hard', question: 'Which Byzantine Emperor codified Roman law into the Corpus Juris Civilis in the 6th century?', options: ['Justinian I', 'Constantine the Great', 'Heraclius', 'Basil II'], answerIndex: 0 },
  { topic: 'History', difficulty: 'hard', question: 'What was the naval battle in 31 BC where Octavian defeated Mark Antony and Cleopatra?', options: ['Battle of Actium', 'Battle of Salamis', 'Battle of Lepanto', 'Battle of Cannae'], answerIndex: 0 },

  // Geography - Easy
  { topic: 'Geography', difficulty: 'easy', question: 'What is the capital city of Australia?', options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'], answerIndex: 0 },
  { topic: 'Geography', difficulty: 'easy', question: 'What is the longest river in the world?', options: ['Nile River', 'Amazon River', 'Yangtze River', 'Mississippi River'], answerIndex: 0 },
  { topic: 'Geography', difficulty: 'easy', question: 'Which continent is home to the Sahara Desert?', options: ['Africa', 'Asia', 'South America', 'Australia'], answerIndex: 0 },

  // Geography - Medium
  { topic: 'Geography', difficulty: 'medium', question: 'Which landlocked European country is divided into 26 cantons?', options: ['Switzerland', 'Austria', 'Luxembourg', 'Liechtenstein'], answerIndex: 0 },
  { topic: 'Geography', difficulty: 'medium', question: 'What is the highest mountain peak in North America (formerly Mt McKinley)?', options: ['Denali', 'Mount Logan', 'Mount Rainier', 'Mount Whitney'], answerIndex: 0 },
  { topic: 'Geography', difficulty: 'medium', question: 'Which strait separates the Mediterranean Sea from the Atlantic Ocean?', options: ['Strait of Gibraltar', 'Bosphorus Strait', 'Strait of Hormuz', 'Strait of Malacca'], answerIndex: 0 },

  // Geography - Hard
  { topic: 'Geography', difficulty: 'hard', question: 'What is the world deepest lake by maximum depth (over 1,600 meters)?', options: ['Lake Baikal', 'Lake Tanganyika', 'Caspian Sea', 'Lake Superior'], answerIndex: 0 },
  { topic: 'Geography', difficulty: 'hard', question: 'Which country has the most natural islands in the world (over 260,000)?', options: ['Sweden', 'Norway', 'Finland', 'Canada'], answerIndex: 0 },

  // Technology - Easy
  { topic: 'Technology', difficulty: 'easy', question: 'What does "CPU" stand for in computer hardware?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Power Utility', 'Control Processing Unit'], answerIndex: 0 },
  { topic: 'Technology', difficulty: 'easy', question: 'Which operating system is represented by a green robot mascot?', options: ['Android', 'iOS', 'Linux', 'Windows'], answerIndex: 0 },
  { topic: 'Technology', difficulty: 'easy', question: 'What does "WWW" stand for in website addresses?', options: ['World Wide Web', 'World Wireless Web', 'Wide World Web', 'Web World Wide'], answerIndex: 0 },

  // Technology - Medium
  { topic: 'Technology', difficulty: 'medium', question: 'In web development, what HTTP status code indicates a "Not Found" error?', options: ['404', '500', '403', '200'], answerIndex: 0 },
  { topic: 'Technology', difficulty: 'medium', question: 'Which company created the open-source Linux kernel in 1991?', options: ['Linus Torvalds', 'Richard Stallman', 'Steve Jobs', 'Bill Gates'], answerIndex: 0 },
  { topic: 'Technology', difficulty: 'medium', question: 'What data structure operates on a "First In, First Out" (FIFO) principle?', options: ['Queue', 'Stack', 'Tree', 'Graph'], answerIndex: 0 },

  // Technology - Hard
  { topic: 'Technology', difficulty: 'hard', question: 'In cryptography, what mathematical problem underlies the security of RSA encryption?', options: ['Prime Factorization of large integers', 'Discrete Logarithm problem', 'Elliptic Curve point addition', 'Knapsack Problem'], answerIndex: 0 },
  { topic: 'Technology', difficulty: 'hard', question: 'In distributed systems, what does the "CAP" theorem state you can only guarantee two of?', options: ['Consistency, Availability, Partition tolerance', 'Concurrency, Accuracy, Performance', 'Capacity, Authorization, Persistence', 'Coherence, Authentication, Protocol'], answerIndex: 0 }
];

function buildLocalQuiz({ topic, difficulty, numQuestions }) {
  const safeTopic = String(topic || 'General Knowledge').toLowerCase().trim();
  const safeDiff = String(difficulty || 'medium').toLowerCase().trim();
  const total = Math.max(3, Number(numQuestions) || 5);

  // Filter bank by matching topic & difficulty
  let matched = CURATED_TRIVIA_BANK.filter((item) => {
    const topicMatch =
      item.topic.toLowerCase().includes(safeTopic) ||
      safeTopic.includes(item.topic.toLowerCase().split(' ')[0]);
    const diffMatch = item.difficulty === safeDiff;
    return topicMatch && diffMatch;
  });

  // If not enough exact matches, widen to matching difficulty
  if (matched.length < total) {
    const diffOnly = CURATED_TRIVIA_BANK.filter((item) => item.difficulty === safeDiff);
    matched = [...matched, ...diffOnly];
  }

  // Shuffle and pick
  const shuffled = shuffleArray(matched);
  const selected = shuffled.slice(0, total);

  // If still need more, generate dynamic questions for that topic & difficulty
  while (selected.length < total) {
    const idx = selected.length + 1;
    selected.push({
      topic: safeTopic,
      difficulty: safeDiff,
      question: `In ${difficulty.toUpperCase()} ${topic}, which fact demonstrates verified understanding?`,
      options: [
        `Core verified principle #${idx} of ${topic}`,
        `Superficial misconception #${idx}`,
        `Unrelated assumption`,
        `Outdated incorrect claim`
      ],
      answerIndex: 0
    });
  }

  return {
    questions: formatAndRandomizeQuestions(selected)
  };
}

router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, difficulty, numQuestions = 5 } = req.body;
    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'topic and difficulty required' });
    }

    const safeTopic = String(topic).trim();
    const safeDifficulty = String(difficulty).toLowerCase().trim();
    const count = Math.max(3, Math.min(10, Number(numQuestions) || 5));

    if (useFallback) {
      console.log('Serving curated trivia quiz (fallback mode).');
      return res.json({ generated: buildLocalQuiz({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count }), source: 'fallback' });
    }

    // Dynamic entropy to guarantee fresh questions on every single request
    const entropySeed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const difficultyInstructions = {
      easy: 'EASY LEVEL: Questions must be fun, accessible, and focus on well-known popular facts and basic fundamentals. Options must be distinct and clear.',
      medium: 'MEDIUM LEVEL: Questions must test practical knowledge, key mechanisms, notable historical milestones, or interesting specific details. Avoid overly simple obvious facts. Create smart distractors.',
      hard: 'HARD LEVEL: Questions must be challenging, expert-level, and test deep understanding, nuanced distinctions, advanced theories, or lesser-known master facts. Distractors must be highly plausible.'
    };

    const diffGuide = difficultyInstructions[safeDifficulty] || difficultyInstructions.medium;

    const systemPrompt = `You are an elite, highly creative trivia quiz generator for the adventure game Quiz-A-Roo.
Target Topic: "${safeTopic}"
Target Difficulty: "${safeDifficulty.toUpperCase()}"
${diffGuide}

CRITICAL RULES:
1. Generate EXACTLY ${count} fresh, unique multiple-choice questions on "${safeTopic}".
2. STRICTLY tailor the complexity, depth, and vocabulary to the "${safeDifficulty.toUpperCase()}" difficulty level.
3. Every question must have 4 distinct, plausible options.
4. Distribute the correct answer evenly among options (do not always place it at index 0).
5. Output ONLY a valid JSON object with key "questions" containing an array of question objects.
6. Each question object must have:
   - "id": number (1 to ${count})
   - "question": string
   - "options": array of exactly 4 strings
   - "answerIndex": number (0, 1, 2, or 3) pointing to the correct option.`;

    const userPrompt = `Generate ${count} brand-new ${safeDifficulty} multiple-choice trivia questions for "${safeTopic}". Seed: ${entropySeed}. Return valid JSON only.`;

    let lastError = null;
    let parsed = null;

    for (const modelName of MODEL_FALLBACKS) {
      try {
        console.log(`Generating ${safeDifficulty} quiz for "${safeTopic}" using model: ${modelName}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 16000);

        const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.85, // Higher temperature ensures fresh questions every time
            max_tokens: 2200
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Model ${modelName} returned status ${response.status}: ${errText}`);
          lastError = { modelName, status: response.status, errText };
          continue;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

        try {
          parsed = JSON.parse(text);
        } catch (err) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          // Shuffle options & randomize answerIndex to guarantee no Option-A bias
          const formattedQuestions = formatAndRandomizeQuestions(parsed.questions);

          console.log(`✅ Generated ${formattedQuestions.length} fresh ${safeDifficulty} questions using ${modelName}`);
          return res.json({
            generated: { questions: formattedQuestions },
            source: 'llm',
            model: modelName,
            difficulty: safeDifficulty,
            topic: safeTopic
          });
        }

        lastError = { modelName, errText: 'Invalid JSON payload received from LLM' };
      } catch (err) {
        lastError = { modelName, errText: err.message };
        console.warn(`Model ${modelName} failed with error: ${err.message}`);
      }
    }

    // If all LLM calls failed, serve curated fallback quiz
    const fallbackQuiz = buildLocalQuiz({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count });
    console.warn('All LLM models failed; serving curated trivia fallback quiz.', lastError);
    return res.json({
      generated: fallbackQuiz,
      source: 'fallback',
      notice: 'Served curated trivia quiz',
      error: lastError?.errText
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    const fallbackQuiz = buildLocalQuiz({
      topic: req.body?.topic,
      difficulty: req.body?.difficulty,
      numQuestions: req.body?.numQuestions || 5
    });
    return res.json({ generated: fallbackQuiz, source: 'fallback', error: err.message });
  }
});

module.exports = router;
