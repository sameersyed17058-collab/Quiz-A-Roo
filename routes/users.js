const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase, isSupabaseReady } = require('../supabase-client');

const SECRET_SALT = process.env.EXPLORER_SECRET_SALT || 'quizaroo-outback-secret-2026';

// In-memory fallback store
const users = new Map();
const quizHistories = [];
const leaderboard = [];

const STAGE_CONFIG = [
  { id: 'stage-1', topic: 'General Knowledge', difficulty: 'easy' },
  { id: 'stage-2', topic: 'Science & Nature', difficulty: 'easy' },
  { id: 'stage-3', topic: 'Pop Culture', difficulty: 'medium' },
  { id: 'stage-4', topic: 'History', difficulty: 'medium' },
  { id: 'stage-5', topic: 'Geography', difficulty: 'hard' },
  { id: 'stage-6', topic: 'Technology', difficulty: 'hard' },
  { id: 'stage-7', topic: 'Science, History & World Mastery', difficulty: 'hard' }
];

// Deterministic, secure 6-digit Secret Explorer Key
function generateSecretExplorerId(userId, userName) {
  const hash = crypto
    .createHmac('sha256', SECRET_SALT)
    .update(`${userId}:${userName.toLowerCase().trim()}`)
    .digest('hex');
  const num = (parseInt(hash.slice(0, 8), 16) % 900000) + 100000;
  return `ROO-${num}`;
}

function verifySecretExplorerId(userId, userName, inputSecretId) {
  if (!inputSecretId) return false;
  const expected = generateSecretExplorerId(userId, userName);
  const cleanInput = String(inputSecretId).trim().toUpperCase();
  const normalizedInput = cleanInput.startsWith('ROO-') ? cleanInput : `ROO-${cleanInput}`;
  return normalizedInput === expected;
}

// Calculate and reconstruct stage progress from quiz_results
async function calculatePlayerProgress(cleanName) {
  const progress = {
    'stage-1': { unlocked: true, stars: 0, bestScore: 0, completed: false }
  };

  if (isSupabaseReady) {
    const { data: results, error } = await supabase
      .from('quiz_results')
      .select('*')
      .ilike('player_name', cleanName);

    if (!error && Array.isArray(results)) {
      results.forEach((r) => {
        const stars =
          r.score === r.total
            ? 3
            : r.score >= Math.ceil(r.total * 0.7)
            ? 2
            : r.score >= Math.ceil(r.total * 0.4)
            ? 1
            : 0;

        STAGE_CONFIG.forEach((stage, idx) => {
          const matchTopic =
            r.topic &&
            stage.topic &&
            (r.topic.toLowerCase().includes(stage.topic.toLowerCase().split(' ')[0]) ||
              stage.topic.toLowerCase().includes(r.topic.toLowerCase().split(' ')[0]));
          const matchDiff = String(r.difficulty || '').toLowerCase() === stage.difficulty.toLowerCase();

          if (matchTopic && matchDiff) {
            const current = progress[stage.id] || {
              unlocked: idx === 0,
              stars: 0,
              bestScore: 0,
              completed: false
            };
            const newStars = Math.max(current.stars, stars);
            const newScore = Math.max(current.bestScore, r.score || 0);
            progress[stage.id] = {
              unlocked: true,
              stars: newStars,
              bestScore: newScore,
              completed: newStars >= 1
            };
          }
        });
      });
    }
  }

  // Ensure unlock chain: stage 1 unlocked by default; next unlocked if prev has stars >= 1
  STAGE_CONFIG.forEach((stage, idx) => {
    if (idx === 0) {
      if (!progress[stage.id]) {
        progress[stage.id] = { unlocked: true, stars: 0, bestScore: 0, completed: false };
      } else {
        progress[stage.id].unlocked = true;
      }
    }

    if (progress[stage.id]?.stars >= 1 && idx < STAGE_CONFIG.length - 1) {
      const nextStageId = STAGE_CONFIG[idx + 1].id;
      if (!progress[nextStageId]) {
        progress[nextStageId] = { unlocked: true, stars: 0, bestScore: 0, completed: false };
      } else {
        progress[nextStageId].unlocked = true;
      }
    }
  });

  return progress;
}

// Helper: Ensure user exists in Supabase
async function ensureUser(playerName) {
  const cleanName = String(playerName || '').trim();
  if (!cleanName) throw new Error('Player name is required');

  if (!isSupabaseReady) {
    if (!users.has(cleanName)) {
      users.set(cleanName, {
        id: users.size + 1,
        name: cleanName,
        createdAt: new Date(),
        totalQuizzes: 0,
        totalScore: 0,
        totalXP: 0
      });
    }
    return users.get(cleanName);
  }

  // Check if user exists in Supabase
  const { data: list, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .ilike('name', cleanName)
    .limit(1);

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    throw fetchError;
  }

  if (list && list.length > 0) {
    return list[0];
  }

  // Create new user in Supabase
  const newUser = {
    name: cleanName,
    created_at: new Date().toISOString(),
    total_quizzes: 0,
    total_score: 0,
    total_xp: 0
  };

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert([newUser])
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: retryList } = await supabase
        .from('users')
        .select('*')
        .ilike('name', cleanName)
        .limit(1);
      if (retryList && retryList.length > 0) return retryList[0];
    }
    console.error('Error inserting user:', insertError);
    throw insertError;
  }

  return created;
}

// 1. REGISTER: Create a Brand New Explorer (Must be a unique name)
router.post('/register', async (req, res) => {
  try {
    const { playerName } = req.body;
    const cleanName = String(playerName || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Explorer Name is required.' });
    }

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Explorer Name must be at least 2 characters.' });
    }

    if (isSupabaseReady) {
      // Check if this name is already taken
      const { data: existingList } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', cleanName)
        .limit(1);

      if (existingList && existingList.length > 0) {
        return res.status(409).json({
          error: `An explorer named "${cleanName}" already exists! If this is you, please switch to "Login with Secret ID" to access your account.`
        });
      }

      // Create new user
      const user = await ensureUser(cleanName);
      const secretId = generateSecretExplorerId(user.id, user.name);
      const stageProgress = await calculatePlayerProgress(user.name);

      return res.json({
        success: true,
        isNew: true,
        user: {
          id: user.id,
          name: user.name,
          secretId,
          totalQuizzes: 0,
          totalScore: 0,
          totalXP: 0
        },
        stageProgress
      });
    } else {
      if (users.has(cleanName)) {
        return res.status(409).json({
          error: `An explorer named "${cleanName}" already exists! Please use "Login with Secret ID".`
        });
      }
      const user = await ensureUser(cleanName);
      const secretId = generateSecretExplorerId(user.id, user.name);
      const stageProgress = await calculatePlayerProgress(user.name);

      return res.json({
        success: true,
        isNew: true,
        user: {
          id: user.id,
          name: user.name,
          secretId,
          totalQuizzes: 0,
          totalScore: 0,
          totalXP: 0
        },
        stageProgress
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN: Log in with Explorer Name + Secret Explorer ID
router.post('/login', async (req, res) => {
  try {
    const { playerName, secretId } = req.body;
    const cleanName = String(playerName || '').trim();
    const cleanSecret = String(secretId || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Explorer Name is required.' });
    }

    if (!cleanSecret) {
      return res.status(400).json({ error: 'Secret Explorer ID is required to log in (e.g. ROO-123456).' });
    }

    let user = null;

    if (isSupabaseReady) {
      const { data: userList, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', cleanName)
        .limit(1);

      if (error) throw error;

      if (!userList || userList.length === 0) {
        return res.status(404).json({
          error: `No explorer found with name "${cleanName}". Please check the name or register as a New Explorer.`
        });
      }

      const foundUser = userList[0];

      // STRICT AUTHENTICATION: Validate secret ID
      const isValid = verifySecretExplorerId(foundUser.id, foundUser.name, cleanSecret);
      if (!isValid) {
        return res.status(401).json({
          error: `Invalid Secret Explorer ID for "${cleanName}". Access denied. Please enter the correct 6-digit Secret ID (e.g. ROO-XXXXXX).`
        });
      }

      user = foundUser;
    } else {
      user = users.get(cleanName);
      if (!user) {
        return res.status(404).json({ error: `Explorer "${cleanName}" not found.` });
      }
      const isValid = verifySecretExplorerId(user.id, user.name, cleanSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid Secret Explorer ID. Access denied.' });
      }
    }

    const assignedSecret = generateSecretExplorerId(user.id, user.name);
    const stageProgress = await calculatePlayerProgress(user.name);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        secretId: assignedSecret,
        totalQuizzes: user.total_quizzes ?? user.totalQuizzes ?? 0,
        totalScore: user.total_score ?? user.totalScore ?? 0,
        totalXP: user.total_xp ?? user.totalXP ?? 0
      },
      stageProgress
    });
  } catch (err) {
    console.error('Login endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. PROFILE SYNC: Sync profile if already authenticated with secretId
router.post('/profile', async (req, res) => {
  try {
    const { playerName, secretId } = req.body;
    const cleanName = String(playerName || '').trim();
    if (!cleanName) return res.status(400).json({ error: 'playerName required' });

    let user;
    if (isSupabaseReady) {
      const { data: userList } = await supabase
        .from('users')
        .select('*')
        .ilike('name', cleanName)
        .limit(1);

      if (userList && userList.length > 0) {
        const found = userList[0];
        if (secretId) {
          const isValid = verifySecretExplorerId(found.id, found.name, secretId);
          if (!isValid) {
            return res.status(401).json({ error: 'Authentication failed: Secret ID mismatch' });
          }
        }
        user = found;
      }
    }

    if (!user) {
      user = await ensureUser(cleanName);
    }

    const assignedSecret = generateSecretExplorerId(user.id, user.name);
    const stageProgress = await calculatePlayerProgress(user.name);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        secretId: assignedSecret,
        totalQuizzes: user.total_quizzes ?? user.totalQuizzes ?? 0,
        totalScore: user.total_score ?? user.totalScore ?? 0,
        totalXP: user.total_xp ?? user.totalXP ?? 0
      },
      stageProgress
    });
  } catch (err) {
    console.error('Profile endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch stage progress for an explorer from the database
router.get('/progress/:playerName', async (req, res) => {
  try {
    const cleanName = String(req.params.playerName || '').trim();
    if (!cleanName) {
      return res.json({ stageProgress: { 'stage-1': { unlocked: true, stars: 0, bestScore: 0 } } });
    }

    const stageProgress = await calculatePlayerProgress(cleanName);
    res.json({ stageProgress });
  } catch (err) {
    console.error('Progress endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save quiz result
router.post('/quiz-result', async (req, res) => {
  try {
    const { playerName, topic, difficulty, score, total, xpEarned, stars = 0, stageId = null } = req.body;
    const cleanName = String(playerName || '').trim();

    if (!cleanName || !topic || !difficulty || score == null || total == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const calculatedXP = Number(xpEarned) || (score * 75 + (difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 50));
    const calculatedStars = Number(stars) || (score === total ? 3 : score >= Math.ceil(total * 0.7) ? 2 : score >= Math.ceil(total * 0.4) ? 1 : 0);

    const result = {
      playerName: cleanName,
      topic,
      difficulty,
      score: Number(score),
      total: Number(total),
      percentage: Math.round((Number(score) / Number(total)) * 100),
      xpEarned: calculatedXP,
      stars: calculatedStars,
      stageId: stageId || null,
      timestamp: new Date()
    };

    if (isSupabaseReady) {
      // 1. Ensure user exists
      const user = await ensureUser(cleanName);

      // 2. Save result to Supabase
      const { error: resultError } = await supabase.from('quiz_results').insert([{
        player_name: cleanName,
        topic,
        difficulty,
        score: Number(score),
        total: Number(total),
        xp_earned: calculatedXP,
        created_at: new Date().toISOString()
      }]);

      if (resultError) {
        console.error('Error saving quiz result to Supabase:', resultError);
        throw resultError;
      }

      // 3. Update user stats
      const { data: latestList } = await supabase
        .from('users')
        .select('id, total_quizzes, total_score, total_xp')
        .ilike('name', cleanName)
        .limit(1);

      if (latestList && latestList.length > 0) {
        const latestUser = latestList[0];
        await supabase
          .from('users')
          .update({
            total_quizzes: (latestUser.total_quizzes || 0) + 1,
            total_score: (latestUser.total_score || 0) + Number(score),
            total_xp: (latestUser.total_xp || 0) + calculatedXP
          })
          .eq('id', latestUser.id);
      }

      // 4. Calculate updated progress
      const stageProgress = await calculatePlayerProgress(cleanName);

      // 5. Get updated leaderboard (PUBLIC: NO SECRET IDs EXPOSED)
      const { data: leaderboardData } = await supabase
        .from('users')
        .select('name, total_xp, total_quizzes, total_score')
        .order('total_xp', { ascending: false })
        .limit(50);

      const formattedLeaderboard = (leaderboardData || []).map((u) => ({
        name: u.name,
        xp: u.total_xp || 0,
        quizzes: u.total_quizzes || 0,
        totalScore: u.total_score || 0
      }));

      console.log(`✅ Saved quiz result for explorer ${cleanName}: score ${score}/${total}, XP +${calculatedXP}`);
      res.json({
        success: true,
        result,
        stageProgress,
        leaderboard: formattedLeaderboard
      });
    } else {
      // In-memory fallback
      quizHistories.push(result);

      if (users.has(cleanName)) {
        const u = users.get(cleanName);
        u.totalQuizzes += 1;
        u.totalScore += Number(score);
        u.totalXP += calculatedXP;
      } else {
        users.set(cleanName, {
          id: users.size + 1,
          name: cleanName,
          createdAt: new Date(),
          totalQuizzes: 1,
          totalScore: Number(score),
          totalXP: calculatedXP
        });
      }

      const existingEntry = leaderboard.find((e) => e.name === cleanName);
      if (existingEntry) {
        existingEntry.xp += calculatedXP;
        existingEntry.quizzes += 1;
      } else {
        leaderboard.push({
          name: cleanName,
          xp: calculatedXP,
          quizzes: 1,
          difficulty,
          topic
        });
      }

      leaderboard.sort((a, b) => b.xp - a.xp);
      const stageProgress = await calculatePlayerProgress(cleanName);
      res.json({ success: true, result, stageProgress, leaderboard: leaderboard.slice(0, 50) });
    }
  } catch (err) {
    console.error('Error in /quiz-result:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user quiz history
router.get('/history/:playerName', async (req, res) => {
  try {
    const cleanName = String(req.params.playerName || '').trim();
    if (!cleanName) return res.json({ history: [] });

    if (isSupabaseReady) {
      const { data: history, error } = await supabase
        .from('quiz_results')
        .select('*')
        .ilike('player_name', cleanName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz history from Supabase:', error);
        throw error;
      }

      const formattedHistory = (history || []).map((item) => ({
        id: item.id,
        playerName: item.player_name,
        topic: item.topic,
        difficulty: item.difficulty,
        score: item.score,
        total: item.total,
        percentage: Math.round((item.score / item.total) * 100),
        xpEarned: item.xp_earned,
        stars:
          item.score === item.total
            ? 3
            : item.score >= Math.ceil(item.total * 0.7)
            ? 2
            : item.score >= Math.ceil(item.total * 0.4)
            ? 1
            : 0,
        createdAt: item.created_at
      }));

      res.json({ history: formattedHistory });
    } else {
      const history = quizHistories.filter((h) => h.playerName === cleanName);
      res.json({ history });
    }
  } catch (err) {
    console.error('Error in /history/:playerName:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC LEADERBOARD: Returns only public stats (Name, XP, Quizzes). NO SECRET IDs EXPOSED!
router.get('/leaderboard', async (req, res) => {
  try {
    if (isSupabaseReady) {
      const { data: leaderboardData, error } = await supabase
        .from('users')
        .select('name, total_xp, total_quizzes, total_score')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching leaderboard from Supabase:', error);
        throw error;
      }

      const formattedLeaderboard = (leaderboardData || [])
        .filter((u) => u.name && u.name.trim().length > 0)
        .map((u) => ({
          name: u.name.trim(),
          xp: Number(u.total_xp) || 0,
          quizzes: Number(u.total_quizzes) || 0,
          totalScore: Number(u.total_score) || 0
        }));

      res.json({ leaderboard: formattedLeaderboard });
    } else {
      res.json({ leaderboard: leaderboard.slice(0, 50) });
    }
  } catch (err) {
    console.error('Error in /leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
