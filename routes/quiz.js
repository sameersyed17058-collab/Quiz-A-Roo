const express = require('express');
const router = express.Router();
const multer = require('multer');
// Heavy document parsers are lazy-loaded on demand inside extractDocumentText
// to keep serverless lambda boot time fast and memory footprint small.
let _pdfParse = null;
let _mammoth = null;
let _officeParser = null;
function getPdfParse() { if (!_pdfParse) _pdfParse = require('pdf-parse'); return _pdfParse; }
function getMammoth() { if (!_mammoth) _mammoth = require('mammoth'); return _mammoth; }
function getOfficeParser() { if (!_officeParser) _officeParser = require('officeparser'); return _officeParser; }

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
const IS_GROQ_KEY = OPENAI_KEY.startsWith('gsk_');
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || (IS_GROQ_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');

// Active and verified Groq / OpenAI models
const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-120b',
  'groq/compound-mini',
  'openai/gpt-oss-20b'
];
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

const DEFAULT_MODEL =
  process.env.OPENAI_MODEL?.trim() || (IS_GROQ_KEY ? 'qwen/qwen3.8-27b' : 'gpt-4o-mini');

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

  // Sports & Cricket - Easy
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'easy', question: 'How many players are on the field for one cricket team during a match?', options: ['11', '9', '10', '12'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'easy', question: 'What is the term when a cricket batter is dismissed on the very first ball they face?', options: ['Golden duck', 'Silver duck', 'Diamond catch', 'Clean bowled'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'easy', question: 'How many runs are awarded if the ball is hit over the boundary rope on the full without bouncing?', options: ['6', '4', '5', '8'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'easy', question: 'Which equipment item does a wicketkeeper wear that regular outfielders cannot wear?', options: ['Webbed catching gloves', 'Helmet', 'Thigh guard', 'Chest protector'], answerIndex: 0 },

  // Sports & Cricket - Medium
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'medium', question: 'Who holds the world record for scoring 100 international centuries across all formats?', options: ['Sachin Tendulkar', 'Virat Kohli', 'Ricky Ponting', 'Jacques Kallis'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'medium', question: 'What mathematical method is used to calculate revised targets in rain-affected limited-overs matches?', options: ['Duckworth-Lewis-Stern method', 'Hawkeye formula', 'Snickometer index', 'Pythagorean run rate'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'medium', question: 'Which country won the inaugural ICC Men T20 World Cup held in South Africa in 2007?', options: ['India', 'Pakistan', 'Australia', 'West Indies'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'medium', question: 'What is the standard length of a cricket pitch between the wickets?', options: ['22 yards (20.12 m)', '20 yards (18.29 m)', '24 yards (21.95 m)', '25 yards (22.86 m)'], answerIndex: 0 },

  // Sports & Cricket - Hard
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'hard', question: 'Who was the first bowler in Test cricket history to take all 10 wickets in a single innings?', options: ['Jim Laker', 'Anil Kumble', 'Ajaz Patel', 'Sydney Barnes'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'hard', question: 'What was the highest individual score in a single Test match innings, scored by Brian Lara against England in 2004?', options: ['400 not out', '375', '380', '405 not out'], answerIndex: 0 },
  { topic: 'Sports', subtopic: 'Cricket', difficulty: 'hard', question: 'Which legendary Sri Lankan spinner holds the record for the most Test wickets in history (800 wickets)?', options: ['Muttiah Muralitharan', 'Shane Warne', 'James Anderson', 'Anil Kumble'], answerIndex: 0 },

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
  { topic: 'Technology', difficulty: 'hard', question: 'In distributed systems, what does the "CAP" theorem state you can only guarantee two of?', options: ['Consistency, Availability, Partition tolerance', 'Concurrency, Accuracy, Performance', 'Capacity, Authorization, Persistence', 'Coherence, Authentication, Protocol'], answerIndex: 0 },

  // Programming & Code - Python
  { topic: 'Programming', subtopic: 'Python', difficulty: 'easy', mode: 'code', question: 'What is the output of the following Python code snippet?\n```python\nprint(type([]) is list)\n```', options: ['True', 'False', '<class \'list\'>', 'TypeError'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Python', difficulty: 'easy', mode: 'code', question: 'What does the following Python statement output?\n```python\nprint([1, 2] * 2)\n```', options: ['[1, 2, 1, 2]', '[2, 4]', '[[1, 2], [1, 2]]', 'TypeError: cannot multiply sequence'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Python', difficulty: 'medium', mode: 'code', question: 'What is the output of the following Python code?\n```python\na = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))\n```', options: ['4', '3', '5', 'Error: list modified in-place'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Python', difficulty: 'medium', mode: 'code', question: 'What is the result of evaluate in Python?\n```python\nprint(bool("False"), bool(""))\n```', options: ['True False', 'False False', 'True True', 'False True'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Python', difficulty: 'hard', mode: 'code', question: 'What does the following code print?\n```python\ndef add_item(val, lst=[]):\n    lst.append(val)\n    return lst\nadd_item(1)\nprint(add_item(2))\n```', options: ['[1, 2]', '[2]', '[1]', 'TypeError'], answerIndex: 0 },

  // Programming & Code - JavaScript
  { topic: 'Programming', subtopic: 'JavaScript', difficulty: 'easy', mode: 'code', question: 'What does `typeof NaN` evaluate to in JavaScript?\n```javascript\nconsole.log(typeof NaN);\n```', options: ['"number"', '"NaN"', '"undefined"', '"object"'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'JavaScript', difficulty: 'easy', mode: 'code', question: 'What is the output of the following JavaScript array transformation?\n```javascript\nconst arr = [1, 2, 3].map(n => n * 2);\nconsole.log(arr);\n```', options: ['[2, 4, 6]', '[1, 2, 3, 1, 2, 3]', '6', '[2, 2, 2]'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'JavaScript', difficulty: 'medium', mode: 'code', question: 'What is logged to the console in JavaScript?\n```javascript\nconsole.log(1 + "2" + 3);\n```', options: ['"123"', '6', '"15"', 'NaN'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'JavaScript', difficulty: 'medium', mode: 'code', question: 'What is the output of this equality check in modern JavaScript?\n```javascript\nconsole.log([] == ![]);\n```', options: ['true', 'false', 'TypeError', 'undefined'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'JavaScript', difficulty: 'hard', mode: 'code', question: 'What is the output of the following asynchronous code?\n```javascript\nconsole.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");\n```', options: ['A, D, C, B', 'A, B, C, D', 'A, D, B, C', 'C, A, D, B'], answerIndex: 0 },

  // Programming & Code - General / C++ / Java / Algorithms
  { topic: 'Programming', subtopic: 'C++', difficulty: 'medium', mode: 'code', question: 'In C++, what does the `*` operator do when placed before a pointer variable in an expression (`*ptr`)?', options: ['Dereferences the pointer to access the stored value', 'Allocates dynamic heap memory', 'Multiplies the memory address', 'Deletes the pointer from memory'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Java', difficulty: 'medium', mode: 'code', question: 'In Java, what does the following comparison return?\n```java\nString s1 = new String("hi");\nString s2 = new String("hi");\nSystem.out.println(s1 == s2);\n```', options: ['false', 'true', 'NullPointerException', 'Compilation error'], answerIndex: 0 },
  { topic: 'Programming', subtopic: 'Algorithms', difficulty: 'hard', mode: 'code', question: 'What is the worst-case time complexity of standard Quicksort algorithm when picking the first element as pivot on an already sorted array?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], answerIndex: 0 }
];

function buildLocalQuiz({ topic, difficulty, numQuestions, quizMode = 'theoretical' }) {
  const safeTopic = String(topic || 'General Knowledge').toLowerCase().trim();
  const safeDiff = String(difficulty || 'medium').toLowerCase().trim();
  const isCode = String(quizMode).toLowerCase().trim() === 'code';
  const total = Math.max(3, Number(numQuestions) || 5);

  const isCricket = safeTopic.includes('cricket') || safeTopic.includes('cric') || safeTopic.includes('ipl') || safeTopic.includes('t20');
  const isSports = isCricket || safeTopic.includes('sport') || safeTopic.includes('football') || safeTopic.includes('soccer') || safeTopic.includes('tennis') || safeTopic.includes('olympic');
  const isProg = safeTopic.includes('program') || safeTopic.includes('code') || safeTopic.includes('python') || safeTopic.includes('java') || safeTopic.includes('c++') || safeTopic.includes('cpp') || safeTopic.includes('sql') || safeTopic.includes('react') || safeTopic.includes('web') || safeTopic.includes('algorithm') || safeTopic.includes('rust');

  // Filter bank by matching topic & difficulty
  let matched = CURATED_TRIVIA_BANK.filter((item) => {
    const itemTopic = item.topic.toLowerCase();
    const itemSub = (item.subtopic || '').toLowerCase();
    const diffMatch = item.difficulty === safeDiff;
    const modeMatch = isCode ? item.mode === 'code' : true;

    let topicMatch = false;
    if (isCricket) {
      topicMatch = itemSub === 'cricket';
    } else if (isSports) {
      topicMatch = itemTopic.includes('sport');
    } else if (isProg) {
      topicMatch = itemTopic.includes('program') || itemTopic.includes('tech') || safeTopic.includes(itemSub);
    } else {
      topicMatch =
        itemTopic.includes(safeTopic) ||
        safeTopic.includes(itemTopic.split(' ')[0]);
    }
    return topicMatch && diffMatch && modeMatch;
  });

  // If not enough exact matches, widen to matching topic across other difficulties first
  if (matched.length < total) {
    const topicOtherDiff = CURATED_TRIVIA_BANK.filter((item) => {
      const itemTopic = item.topic.toLowerCase();
      const itemSub = (item.subtopic || '').toLowerCase();
      const modeMatch = isCode ? item.mode === 'code' : true;
      if (isCricket) return itemSub === 'cricket';
      if (isSports) return itemTopic.includes('sport');
      if (isProg) return itemTopic.includes('program') || itemTopic.includes('tech') || safeTopic.includes(itemSub);
      return (itemTopic.includes(safeTopic) || safeTopic.includes(itemTopic.split(' ')[0])) && modeMatch;
    });
    matched = [...matched, ...topicOtherDiff];
  }

  // Deduplicate matched questions
  const seenQ = new Set();
  const uniqueMatched = [];
  for (const item of matched) {
    if (!seenQ.has(item.question)) {
      seenQ.add(item.question);
      uniqueMatched.push(item);
    }
  }

  // Shuffle and pick
  const shuffled = shuffleArray(uniqueMatched);
  const selected = shuffled.slice(0, total);

  // If still need more, generate dynamic questions specifically tailored for this topic and mode
  const topicTemplates = isCode
    ? [
        {
          q: `What is the expected outcome of the following code snippet in ${topic}?\n\`\`\`${topic}\nfunction evaluate() {\n  let x = 10;\n  return x * 2;\n}\nconsole.log(evaluate());\n\`\`\``,
          opts: ['20', '10', 'undefined', 'ReferenceError: x is not defined'],
          ans: 0
        },
        {
          q: `In ${topic}, which code construct is standard practice for defensive exception handling?`,
          opts: ['try { ... } catch (error) { ... }', 'attempt { ... } rescue (error) { ... }', 'guard { ... } otherwise { ... }', 'check { ... } on_failure { ... }'],
          ans: 0
        },
        {
          q: `What is the runtime time complexity of accessing an element by index in a contiguous array in ${topic}?`,
          opts: ['O(1) Constant Time', 'O(n) Linear Time', 'O(log n) Logarithmic Time', 'O(n²) Quadratic Time'],
          ans: 0
        },
        {
          q: `In ${topic}, which statement correctly explains how memory allocation behaves for primitive values?`,
          opts: ['Primitive values are typically allocated directly on the call stack', 'Primitives always require dynamic heap garbage collection', 'Primitives must be manually freed with explicit pointer calls', 'Primitives are automatically converted to synchronized database locks'],
          ans: 0
        },
        {
          q: `Which syntax in ${topic} correctly specifies an anonymous arrow or lambda function returning a value?`,
          opts: ['(param) => param * 2', 'function => (param * 2)', 'lambda: param -> { return * 2 }', 'def (param): return param * 2'],
          ans: 0
        }
      ]
    : [
        {
          q: `Which fundamental principle or architecture is central to ${topic}?`,
          opts: [`Standard core specification and architectural model of ${topic}`, `Discredited legacy myth`, `Unverified third-party patch`, `Informal experimental rule`],
          ans: 0
        },
        {
          q: `In theoretical frameworks of ${topic}, what concept guarantees correct system behavior?`,
          opts: [`Consistent abstraction and rigorous verification protocols`, `Ad-hoc variable guessing`, `Unchecked arbitrary assumptions`, `Non-deterministic side-effects`],
          ans: 0
        },
        {
          q: `Which notable milestone or historic evolution shaped modern ${topic}?`,
          opts: [`Foundational standardization milestone in ${topic}`, `Cancelled draft proposal`, `Obsolete proprietary specification`, `Unpublished private workshop note`],
          ans: 0
        },
        {
          q: `What key mechanism or foundational paradigm is essential for mastery in ${topic}?`,
          opts: [`Systematic algorithmic principles and structured patterns`, `Passive hesitation and delayed reactions`, `Uncalculated unstructured mutation`, `Static non-adaptive workflow`],
          ans: 0
        },
        {
          q: `Which pioneer or research breakthrough is widely celebrated as foundational to ${topic}?`,
          opts: [`Pioneering architecture milestone in ${topic}`, `First-year introductory experiment`, `Fictional cinematic concept`, `Defunct deprecated prototype`],
          ans: 0
        }
      ];

  let tIdx = 0;
  while (selected.length < total) {
    const tmpl = topicTemplates[tIdx % topicTemplates.length];
    tIdx++;
    selected.push({
      topic: safeTopic,
      difficulty: safeDiff,
      question: tmpl.q,
      options: tmpl.opts,
      answerIndex: tmpl.ans
    });
  }

  return {
    questions: formatAndRandomizeQuestions(selected)
  };
}

router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, difficulty, numQuestions = 5, quizMode = 'theoretical' } = req.body;
    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'topic and difficulty required' });
    }

    const safeTopic = String(topic).trim();
    const safeDifficulty = String(difficulty).toLowerCase().trim();
    const safeMode = String(quizMode).toLowerCase().trim();
    const isCodeMode = safeMode === 'code';
    const count = Math.max(3, Math.min(10, Number(numQuestions) || 5));

    if (useFallback) {
      console.log('Serving curated trivia quiz (fallback mode).');
      return res.json({
        generated: buildLocalQuiz({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count, quizMode: safeMode }),
        source: 'fallback',
        quizMode: safeMode
      });
    }

    // Dynamic entropy & variety angles to guarantee completely fresh, unique questions every time
    const entropySeed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const varietyAngles = [
      'surprising world records, iconic milestones, and historic turnarounds',
      'essential rules, strategic mechanics, scoring systems, and key technical terms',
      'legendary champions, memorable tournament finals, and historical icons',
      'lesser-known fascinating trivia, global records, and origins',
      'modern achievements, contemporary stars, and premier records'
    ];
    const chosenAngle = varietyAngles[Math.floor(Math.random() * varietyAngles.length)];

    const difficultyInstructions = {
      easy: 'EASY LEVEL: Questions must be fun, accessible, and focus on well-known popular facts and basic fundamentals. Options must be distinct and clear.',
      medium: 'MEDIUM LEVEL: Questions must test practical knowledge, key mechanisms, notable historical milestones, or interesting specific details. Avoid overly simple obvious facts. Create smart distractors.',
      hard: 'HARD LEVEL: Questions must be challenging, expert-level, and test deep understanding, nuanced distinctions, advanced theories, or lesser-known master facts. Distractors must be highly plausible.'
    };

    const diffGuide = difficultyInstructions[safeDifficulty] || difficultyInstructions.medium;

    const modePromptGuide = isCodeMode
      ? `\nQUIZ MODE: MANDATORY CODE-BASED QUESTIONS!
- Every question MUST involve actual code snippets, syntax analysis, output tracing ("What is the output of the following code snippet?"), or bug finding in "${safeTopic}".
- Format code snippets cleanly inside Markdown code blocks (e.g. \`\`\`${safeTopic} ... \`\`\`).
- Distractors must represent plausible syntax variants, common error returns, or alternative outputs.`
      : `\nQUIZ MODE: THEORETICAL. Emphasize theoretical concepts, memory models, definitions, architecture, and principles without raw execution blocks.`;

    const systemPrompt = `You are an elite, highly creative trivia quiz generator for the adventure game Quiz-A-Roo.
Target Subject: "${safeTopic}"
Target Difficulty: "${safeDifficulty.toUpperCase()}"
Variety Angle: Explore ${chosenAngle} within "${safeTopic}".
${diffGuide}
${modePromptGuide}

CRITICAL RULES:
1. Generate EXACTLY ${count} fresh, unique multiple-choice questions EXCLUSIVELY about "${safeTopic}".
2. STRICTLY tailor the complexity, depth, and vocabulary to the "${safeDifficulty.toUpperCase()}" difficulty level.
3. Every question must have 4 distinct, plausible options.
4. Distribute the correct answer evenly among options (do not always place it at index 0).
5. Output ONLY a valid JSON object with key "questions" containing an array of question objects.
6. ANTI-REPETITION MANDATE: Do NOT generate common beginner cliché questions. Each question must test engaging, fresh knowledge strictly within "${safeTopic}".
7. Each question object must have:
   - "id": number (1 to ${count})
   - "question": string
   - "options": array of exactly 4 strings
   - "answerIndex": number (0, 1, 2, or 3) pointing to the correct option.`;

    const userPrompt = `Generate ${count} brand-new, unique ${safeDifficulty} multiple-choice trivia questions EXCLUSIVELY about "${safeTopic}". Mode: ${safeMode}. Seed: ${entropySeed}. Angle: ${chosenAngle}. Return valid JSON only.`;

    let lastError = null;
    let parsed = null;

    // Allocate safe token budget so Groq free tier limit (1000 OTPM) is never exceeded
    const tokenLimit = Math.min(950, Math.max(550, count * 180));

    for (const modelName of MODEL_FALLBACKS) {
      try {
        console.log(`Generating ${safeDifficulty} (${safeMode}) quiz for "${safeTopic}" using model: ${modelName}`);

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
            temperature: 0.9,
            max_tokens: tokenLimit
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
          const formattedQuestions = formatAndRandomizeQuestions(parsed.questions);

          console.log(`✅ Generated ${formattedQuestions.length} fresh ${safeDifficulty} questions using ${modelName}`);
          return res.json({
            generated: { questions: formattedQuestions },
            source: 'llm',
            model: modelName,
            difficulty: safeDifficulty,
            topic: safeTopic,
            quizMode: safeMode
          });
        }

        lastError = { modelName, errText: 'Invalid JSON payload received from LLM' };
      } catch (err) {
        lastError = { modelName, errText: err.message };
        console.warn(`Model ${modelName} failed with error: ${err.message}`);
      }
    }

    // If all LLM calls failed, serve curated fallback quiz
    const fallbackQuiz = buildLocalQuiz({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count, quizMode: safeMode });
    console.warn('All LLM models failed; serving curated trivia fallback quiz.', lastError);
    return res.json({
      generated: fallbackQuiz,
      source: 'fallback',
      notice: 'Served curated trivia quiz',
      error: lastError?.errText,
      quizMode: safeMode
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    const fallbackQuiz = buildLocalQuiz({
      topic: req.body?.topic,
      difficulty: req.body?.difficulty,
      numQuestions: req.body?.numQuestions || 5,
      quizMode: req.body?.quizMode || 'theoretical'
    });
    return res.json({ generated: fallbackQuiz, source: 'fallback', error: err.message });
  }
});

// =========================================================================
// HANGAROO / FILL-IN-THE-BLANKS QUIZ GENERATOR
// =========================================================================
const CURATED_HANGAROO_BANK = [
  // Programming & Tech
  { category: 'Programming', difficulty: 'easy', clue: 'The keyword in Python used to define a function', answer: 'DEF', hint: 'Short for define' },
  { category: 'Programming', difficulty: 'easy', clue: 'A sequence of characters enclosed in quotation marks', answer: 'STRING', hint: 'Basic text data type' },
  { category: 'Programming', difficulty: 'easy', clue: 'The stylesheet language used to style and lay out web pages', answer: 'CSS', hint: 'Cascading Style Sheets' },
  { category: 'Programming', difficulty: 'medium', clue: 'A function that calls itself repeatedly until reaching a base condition', answer: 'RECURSION', hint: 'Self-calling function' },
  { category: 'Programming', difficulty: 'medium', clue: 'A linear data structure following Last-In First-Out (LIFO) order', answer: 'STACK', hint: 'Push and pop' },
  { category: 'Programming', difficulty: 'medium', clue: 'JavaScript runtime built on Chrome V8 engine for server-side code', answer: 'NODEJS', hint: 'Server runtime' },
  { category: 'Programming', difficulty: 'hard', clue: 'Programming paradigm emphasizing immutability and pure functions', answer: 'FUNCTIONAL', hint: 'Opposite of imperative' },
  { category: 'Programming', difficulty: 'hard', clue: 'Optimization technique storing results of expensive function calls', answer: 'MEMOIZATION', hint: 'Caching computations' },
  { category: 'Artificial Intelligence', difficulty: 'easy', clue: 'AI model structure inspired by biological brain neural connections', answer: 'NEURAL NETWORK', hint: 'Layers of interconnected nodes' },
  { category: 'Artificial Intelligence', difficulty: 'medium', clue: 'The deep learning architecture powering modern LLMs using self-attention', answer: 'TRANSFORMER', hint: 'Introduced in Attention is All You Need' },
  { category: 'Artificial Intelligence', difficulty: 'hard', clue: 'Technique that adjusts pre-trained model weights on a targeted domain dataset', answer: 'FINE TUNING', hint: 'Specializing an existing model' },
  { category: 'Science', difficulty: 'easy', clue: 'The cellular organelle known as the powerhouse of eukaryotic cells', answer: 'MITOCHONDRIA', hint: 'Generates cellular ATP' },
  { category: 'Science', difficulty: 'medium', clue: 'Subatomic particle with negative electrical charge orbiting an atom nucleus', answer: 'ELECTRON', hint: 'Negative charge carrier' },
  { category: 'Science', difficulty: 'hard', clue: 'Quantum state where particles remain linked regardless of physical distance', answer: 'ENTANGLEMENT', hint: 'Correlated quantum states' },
  { category: 'History', difficulty: 'easy', clue: 'Ancient civilization along the Nile that constructed monumental stone pyramids', answer: 'EGYPTIANS', hint: 'Land of Pharaohs' },
  { category: 'History', difficulty: 'medium', clue: 'Historic Eurasian trade route connecting Imperial China with the Mediterranean', answer: 'SILK ROAD', hint: 'Trade caravan network' },
  { category: 'Geography', difficulty: 'easy', clue: 'The largest and deepest of Earth oceanic divisions', answer: 'PACIFIC', hint: 'Covers over 30% of Earth' },
  { category: 'Geography', difficulty: 'medium', clue: 'The planned capital city of the Commonwealth of Australia', answer: 'CANBERRA', hint: 'Located in ACT' },
  { category: 'Pop Culture', difficulty: 'easy', clue: 'The vigilante superhero protecting Gotham City known as the Caped Crusader', answer: 'BATMAN', hint: 'Alter-ego of Bruce Wayne' },
  { category: 'Pop Culture', difficulty: 'medium', clue: 'The fictional continent where the Iron Throne of Westeros resides', answer: 'WESTEROS', hint: 'Game of Thrones setting' }
];

function buildLocalHangaroo({ topic = 'General', difficulty = 'medium', numQuestions = 5 }) {
  const safeTopic = String(topic || 'General').toLowerCase().trim();
  const safeDiff = String(difficulty || 'medium').toLowerCase().trim();
  const count = Math.max(3, Math.min(10, Number(numQuestions) || 5));

  let matched = CURATED_HANGAROO_BANK.filter(item => {
    const cat = item.category.toLowerCase();
    return (cat.includes(safeTopic) || safeTopic.includes(cat) || safeTopic === 'general') && item.difficulty === safeDiff;
  });

  if (matched.length < count) {
    matched = [...matched, ...CURATED_HANGAROO_BANK.filter(item => {
      const cat = item.category.toLowerCase();
      return cat.includes(safeTopic) || safeTopic.includes(cat) || safeTopic === 'general';
    })];
  }

  if (matched.length < count) {
    matched = [...matched, ...CURATED_HANGAROO_BANK];
  }

  const seen = new Set();
  const unique = [];
  for (const item of matched) {
    if (!seen.has(item.answer)) {
      seen.add(item.answer);
      unique.push(item);
    }
  }

  const shuffled = shuffleArray(unique).slice(0, count);
  return shuffled.map((item, idx) => ({
    id: idx + 1,
    clue: item.clue,
    answer: item.answer.toUpperCase(),
    hint: item.hint || 'Guess the letters to solve the puzzle!',
    category: item.category
  }));
}

router.post('/generate-hangaroo', async (req, res) => {
  try {
    const { topic = 'General Trivia', difficulty = 'medium', numQuestions = 5 } = req.body;
    const safeTopic = String(topic).trim();
    const safeDifficulty = String(difficulty).toLowerCase().trim();
    const count = Math.max(3, Math.min(10, Number(numQuestions) || 5));

    if (useFallback) {
      const localPuzzles = buildLocalHangaroo({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count });
      return res.json({ generated: { questions: localPuzzles }, source: 'fallback' });
    }

    const systemPrompt = `You are an expert game puzzle creator for Hangaroo on Quiz-A-Roo.
Target Topic: "${safeTopic}"
Target Difficulty: "${safeDifficulty.toUpperCase()}"

CRITICAL RULES:
1. Generate EXACTLY ${count} exciting word-blank guessing puzzles about "${safeTopic}".
2. "answer" MUST be a single word or 2-word phrase (A-Z characters only, uppercase, length 3-14 letters). No numbers or punctuation.
3. "clue" must be a crisp, engaging sentence testing knowledge of the answer.
4. "hint" must provide a fun, helpful hint.
5. "category" should be "${safeTopic}".
6. Output ONLY valid JSON:
{"questions": [{"id": 1, "clue": "...", "answer": "...", "hint": "...", "category": "${safeTopic}"}]}`;

    const userPrompt = `Generate ${count} ${safeDifficulty} Hangaroo word-blank puzzles about "${safeTopic}". Return valid JSON only.`;

    for (const modelName of MODEL_FALLBACKS) {
      try {
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
            temperature: 0.8,
            max_tokens: Math.min(900, count * 160)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        let parsed = null;
        try { parsed = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const formatted = parsed.questions.map((q, idx) => ({
            id: idx + 1,
            clue: String(q.clue || '').trim(),
            answer: String(q.answer || '').toUpperCase().replace(/[^A-Z ]/g, '').trim(),
            hint: String(q.hint || `Clue for ${safeTopic}`).trim(),
            category: safeTopic
          })).filter(q => q.answer.length >= 2);

          if (formatted.length >= 3) {
            return res.json({
              generated: { questions: formatted.slice(0, count) },
              source: 'llm',
              model: modelName,
              topic: safeTopic,
              difficulty: safeDifficulty
            });
          }
        }
      } catch (err) {
        console.warn(`Hangaroo generation error on ${modelName}:`, err.message);
      }
    }

    const fallbackPuzzles = buildLocalHangaroo({ topic: safeTopic, difficulty: safeDifficulty, numQuestions: count });
    return res.json({ generated: { questions: fallbackPuzzles }, source: 'fallback' });
  } catch (err) {
    console.error('Hangaroo error:', err);
    const fallbackPuzzles = buildLocalHangaroo({ topic: req.body?.topic, difficulty: req.body?.difficulty, numQuestions: 5 });
    return res.json({ generated: { questions: fallbackPuzzles }, source: 'fallback', error: err.message });
  }
});

// =========================================================================
// DOCUMENT EXTRACTION & CLEANING UTILITIES
// =========================================================================

// Clean and sanitize text: strip null bytes, non-printable control characters, unicode replacement chars
function sanitizeAndCleanText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\uFFFD/g, '') // remove Unicode replacement character
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// Guard against binary garbage (zip files, corrupt PDFs, executables, non-text files)
function isBinaryGarbage(text) {
  if (!text || typeof text !== 'string' || text.length < 10) return true;

  // Check magic byte signatures that leak through as raw strings
  if (
    text.startsWith('PK\x03\x04') ||
    text.startsWith('7z\xBC\xAF') ||
    text.startsWith('\x1f\x8b') ||
    text.startsWith('MZ')
  ) {
    return true;
  }

  // Count printable standard characters in first 2000 chars
  const sample = text.slice(0, 2000);
  const printable = sample.match(/[a-zA-Z0-9\s.,!?;:()'"\-\/\\=\[\]{}<>@#$%^&*_+=`~|]/g) || [];
  const printableRatio = printable.length / sample.length;

  return printableRatio < 0.70;
}

// Multi-format extractor supporting DOCX, DOC, PDF, PPTX, PPT, XLSX, XLS, ODT, ODS, ODP, RTF, and text/code
async function extractDocumentText(buffer, originalName = '', mimetype = '') {
  const nameLower = (originalName || '').toLowerCase();
  let extractedText = '';

  // 1. PDF Documents
  if (nameLower.endsWith('.pdf') || mimetype === 'application/pdf') {
    try {
      const pdfParse = getPdfParse();
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } catch (pdfErr) {
      console.warn('pdf-parse failed, attempting officeParser for PDF:', pdfErr.message);
      try {
        const officeParser = getOfficeParser();
        extractedText = await officeParser.parseOffice(buffer, { fileType: 'pdf', outputErrorToConsole: false });
      } catch (opErr) {
        console.warn('officeParser PDF fallback also failed:', opErr.message);
      }
    }
  }
  // 2. Microsoft Word (.docx)
  else if (nameLower.endsWith('.docx') || mimetype.includes('wordprocessingml')) {
    try {
      const mammoth = getMammoth();
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } catch (mammothErr) {
      console.warn('mammoth failed, trying officeParser for docx:', mammothErr.message);
      try {
        const officeParser = getOfficeParser();
        extractedText = await officeParser.parseOffice(buffer, { fileType: 'docx', outputErrorToConsole: false });
      } catch (opErr) {
        console.warn('officeParser docx failed:', opErr.message);
      }
    }
  }
  // 3. Legacy Microsoft Word (.doc)
  else if (nameLower.endsWith('.doc') || mimetype.includes('msword')) {
    try {
      const officeParser = getOfficeParser();
      extractedText = await officeParser.parseOffice(buffer, { fileType: 'doc', outputErrorToConsole: false });
    } catch (err) {
      console.warn('officeParser doc failed:', err.message);
    }
  }
  // 4. PowerPoint (.pptx, .ppt)
  else if (nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt') || mimetype.includes('presentation')) {
    try {
      const ft = nameLower.endsWith('.ppt') ? 'ppt' : 'pptx';
      const officeParser = getOfficeParser();
      extractedText = await officeParser.parseOffice(buffer, { fileType: ft, outputErrorToConsole: false });
    } catch (err) {
      console.warn('officeParser pptx failed:', err.message);
    }
  }
  // 5. Excel (.xlsx, .xls)
  else if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || mimetype.includes('spreadsheet')) {
    try {
      const ft = nameLower.endsWith('.xls') ? 'xls' : 'xlsx';
      const officeParser = getOfficeParser();
      extractedText = await officeParser.parseOffice(buffer, { fileType: ft, outputErrorToConsole: false });
    } catch (err) {
      console.warn('officeParser xlsx failed:', err.message);
    }
  }
  // 6. OpenDocument (.odt, .odp, .ods)
  else if (nameLower.endsWith('.odt') || nameLower.endsWith('.odp') || nameLower.endsWith('.ods')) {
    try {
      const ext = nameLower.split('.').pop();
      const officeParser = getOfficeParser();
      extractedText = await officeParser.parseOffice(buffer, { fileType: ext, outputErrorToConsole: false });
    } catch (err) {
      console.warn('officeParser odt failed:', err.message);
    }
  }
  // 7. Rich Text Format (.rtf)
  else if (nameLower.endsWith('.rtf') || mimetype.includes('rtf')) {
    try {
      const officeParser = getOfficeParser();
      extractedText = await officeParser.parseOffice(buffer, { fileType: 'rtf', outputErrorToConsole: false });
    } catch (err) {
      console.warn('officeParser rtf failed:', err.message);
    }
  }
  // 8. Plain text, markdown, json, csv, code files (.txt, .md, .py, .js, .java, etc.)
  else {
    extractedText = buffer.toString('utf-8');
  }

  return sanitizeAndCleanText(extractedText);
}

// Intelligent content-based fallback questions if LLM is unreachable
function generateIntelligentDocFallback({ docText, docName, count, difficulty, focus }) {
  const cleanLines = docText
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length >= 25 && l.length <= 180 && !l.startsWith('#') && !l.startsWith('//'));

  const sentences = docText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(s => s.length >= 35 && s.length <= 160 && /[a-zA-Z]/.test(s));

  // Extract key capitalized technical phrases or terms
  const terms = Array.from(new Set(
    (docText.match(/\b[A-Z][a-zA-Z0-9_\-]{2,25}\b/g) || [])
      .filter(w => !['The', 'This', 'That', 'These', 'Those', 'With', 'From', 'Have', 'Were', 'Which', 'Their', 'About', 'There', 'When', 'Where', 'What', 'How', 'Assignment', 'Chapter', 'Section', 'Page', 'Figure', 'Table'].includes(w))
  ));

  const pool = sentences.length >= 4 ? sentences : (cleanLines.length >= 4 ? cleanLines : [
    `Key operational requirement detailed in ${docName}`,
    `Primary algorithmic or conceptual principle described in the text`,
    `Standard execution protocol outlined in the study material`,
    `Theoretical model and validation benchmark specified in the document`
  ]);

  const questions = [];

  for (let i = 0; i < count; i++) {
    const targetSentence = pool[i % pool.length];
    const keyTerm = terms[i % (terms.length || 1)] || 'the material';

    // Distractors from other parts of the document
    const distractors = [];
    for (let j = 1; j <= 3; j++) {
      const alt = pool[(i + j * 2) % pool.length];
      if (alt && alt !== targetSentence && !distractors.includes(alt)) {
        distractors.push(alt);
      } else {
        distractors.push(`Alternative approach described in Section ${j + 1}`);
      }
    }

    let stem = '';
    const variant = i % 3;
    if (variant === 0) {
      stem = `According to ${docName}, what is explicitly highlighted regarding "${keyTerm}"?`;
    } else if (variant === 1) {
      stem = `Which of the following statements accurately reflects the documented findings in ${docName}?`;
    } else {
      stem = `Based on the key concepts in ${docName}, which requirement or principle is correct?`;
    }

    questions.push({
      id: i + 1,
      question: stem,
      options: [targetSentence, ...distractors.slice(0, 3)],
      answerIndex: 0
    });
  }

  return formatAndRandomizeQuestions(questions);
}

// =========================================================================
// DOCUMENT UPLOAD & EXAM PREP ENDPOINTS
// =========================================================================
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const originalName = req.file.originalname || 'document.txt';
    const mimetype = req.file.mimetype || '';

    console.log(`Processing document upload: "${originalName}" (${mimetype}, ${req.file.size} bytes)`);

    const cleanText = await extractDocumentText(req.file.buffer, originalName, mimetype);

    if (!cleanText || cleanText.length < 15 || isBinaryGarbage(cleanText)) {
      return res.status(422).json({
        error: `Could not extract readable text from "${originalName}". The file may be password-protected, an unsupported binary format, or contain scanned images without OCR text.`
      });
    }

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = cleanText.length;

    console.log(`✅ Extracted ${wordCount} words (${charCount} chars) from "${originalName}"`);

    return res.json({
      success: true,
      fileName: originalName,
      fileSize: req.file.size,
      text: cleanText,
      wordCount,
      charCount,
      preview: cleanText.slice(0, 500)
    });
  } catch (err) {
    console.error('Upload document error:', err);
    return res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

router.post('/generate-doc-quiz', async (req, res) => {
  try {
    const {
      documentText,
      documentName = 'Uploaded Document',
      difficulty = 'medium',
      focus = 'comprehensive',
      numQuestions = 5,
      quizType = 'mcq'
    } = req.body;

    const cleanDocText = sanitizeAndCleanText(documentText);

    if (!cleanDocText || cleanDocText.length < 20 || isBinaryGarbage(cleanDocText)) {
      return res.status(400).json({
        error: 'Document text is empty or unreadable. Please ensure the uploaded file contains clean readable text.'
      });
    }

    const safeDocName = String(documentName).trim() || 'Uploaded Document';
    const safeDiff = String(difficulty).toLowerCase().trim() || 'medium';
    const safeFocus = String(focus).toLowerCase().trim() || 'comprehensive';
    const count = Math.max(3, Math.min(10, Number(numQuestions) || 5));

    // Limit excerpt to 5,000 characters for snappy 1-2s response times and token safety
    const docSnippet = cleanDocText.slice(0, 5000);

    const focusDescriptions = {
      comprehensive: 'comprehensive exam covering core theoretical principles, definitions, practical applications, and lab steps',
      practical: 'hands-on practical applications, lab procedures, experiment outputs, debugging, and implementation details',
      theoretical: 'theoretical foundations, conceptual models, key definitions, formulas, and fundamental laws'
    };
    const chosenFocus = focusDescriptions[safeFocus] || focusDescriptions.comprehensive;

    // Use fast, verified models
    const DOC_MODELS = Array.from(new Set([
      DEFAULT_MODEL,
      'openai/gpt-oss-120b',
      'qwen/qwen3.6-27b',
      'groq/compound-mini'
    ].filter(Boolean)));

    // 1. Hangaroo format from document
    if (quizType === 'hangaroo') {
      const hangarooSystemPrompt = `You are an academic exam creator designing a Hangaroo fill-in-the-blank exam review puzzle based EXCLUSIVELY on the provided document.
Document: "${safeDocName}"
Difficulty: "${safeDiff.toUpperCase()}"
Focus: ${chosenFocus}

Document excerpt:
"""
${docSnippet}
"""

CRITICAL RULES:
1. Extract EXACTLY ${count} essential key terms, acronyms, or technical keywords directly from the text.
2. The "answer" MUST be a single word or 2-word phrase (A-Z characters only, uppercase, length 3-14 letters).
3. The "clue" must be an engaging, informative trivia clue/sentence testing knowledge of that term from the document.
4. Output ONLY valid JSON:
{"questions": [{"id": 1, "clue": "...", "answer": "...", "hint": "...", "category": "${safeDocName}"}]}`;

      const hangarooUserPrompt = `Extract ${count} exam key-term blanks from "${safeDocName}". Difficulty: ${safeDiff}. Return valid JSON only.`;

      for (const modelName of DOC_MODELS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: hangarooSystemPrompt },
                { role: 'user', content: hangarooUserPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7,
              max_tokens: 800
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) continue;
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          let parsed = null;
          try { parsed = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }

          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const formatted = parsed.questions.map((q, idx) => ({
              id: idx + 1,
              clue: String(q.clue || '').trim(),
              answer: String(q.answer || '').toUpperCase().replace(/[^A-Z ]/g, '').trim(),
              hint: String(q.hint || `Exam key term from ${safeDocName}`).trim(),
              category: safeDocName
            })).filter(q => q.answer.length >= 2);

            return res.json({
              generated: { questions: formatted.slice(0, count) },
              source: 'llm',
              model: modelName,
              documentName: safeDocName,
              difficulty: safeDiff,
              quizType: 'hangaroo'
            });
          }
        } catch (err) {
          console.warn(`Doc Hangaroo generation failed on ${modelName}:`, err.message);
        }
      }

      // Fallback Hangaroo from document words
      const wordsInDoc = Array.from(new Set(docSnippet.match(/\b[A-Za-z]{4,12}\b/g) || []))
        .filter(w => !['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'about', 'there', 'these', 'would', 'could'].includes(w.toLowerCase()))
        .slice(0, count);

      const fallbackDocHangaroo = wordsInDoc.map((w, idx) => ({
        id: idx + 1,
        clue: `Core technical terminology from ${safeDocName} emphasized in the study material:`,
        answer: w.toUpperCase(),
        hint: `Appears in ${safeDocName}`,
        category: safeDocName
      }));

      return res.json({
        generated: { questions: fallbackDocHangaroo },
        source: 'fallback',
        documentName: safeDocName,
        difficulty: safeDiff,
        quizType: 'hangaroo'
      });
    }

    // 2. MCQ format from document
    const systemPrompt = `You are a university professor creating an exam preparation quiz based EXCLUSIVELY on the provided student document/manual:
Document Name: "${safeDocName}"
Target Difficulty: "${safeDiff.toUpperCase()}"
Exam Focus: ${chosenFocus}

Document excerpt:
"""
${docSnippet}
"""

CRITICAL RULES:
1. Generate EXACTLY ${count} multiple-choice exam questions testing specific material, procedures, equations, lab findings, definitions, or code directly present in this document.
2. Strictly adhere to ${safeDiff.toUpperCase()} difficulty.
3. Every question must have 4 distinct, plausible, informative options (not generic labels).
4. Distribute the correct answer evenly across indices (0, 1, 2, 3).
5. Output ONLY valid JSON:
{"questions": [{"id": 1, "question": "...", "options": ["...", "...", "...", "..."], "answerIndex": 0}]}`;

    const userPrompt = `Generate ${count} ${safeDiff} multiple-choice exam questions directly based on the content of "${safeDocName}". Return valid JSON only.`;

    for (const modelName of DOC_MODELS) {
      try {
        console.log(`Generating exam quiz for "${safeDocName}" using model: ${modelName}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: Math.min(1000, Math.max(500, count * 190))
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`Doc quiz model ${modelName} returned ${response.status}: ${errBody.slice(0, 100)}`);
          continue;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        let parsed = null;
        try { parsed = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const formattedQuestions = formatAndRandomizeQuestions(parsed.questions);
          console.log(`✅ Successfully generated ${formattedQuestions.length} exam questions using ${modelName}`);
          return res.json({
            generated: { questions: formattedQuestions },
            source: 'llm',
            model: modelName,
            documentName: safeDocName,
            difficulty: safeDiff,
            quizType: 'mcq'
          });
        }
      } catch (err) {
        console.warn(`Doc quiz generation failed on ${modelName}:`, err.message);
      }
    }

    // Intelligent content-based Fallback MCQ generator if all LLMs fail
    console.warn('All LLM calls failed for doc quiz; invoking intelligent content fallback generator.');
    const fallbackQuestions = generateIntelligentDocFallback({
      docText: cleanDocText,
      docName: safeDocName,
      count,
      difficulty: safeDiff,
      focus: safeFocus
    });

    return res.json({
      generated: { questions: fallbackQuestions },
      source: 'fallback',
      documentName: safeDocName,
      difficulty: safeDiff,
      quizType: 'mcq'
    });
  } catch (err) {
    console.error('Doc quiz error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate document quiz' });
  }
});

module.exports = router;
