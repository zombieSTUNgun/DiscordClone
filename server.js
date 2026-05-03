const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

const categories = new Set(['LFG', 'Trades', 'Guilds', 'Esports', 'Hardware', 'General']);

const seedPosts = [
  { id: 'seed-1', title: 'LF2 for ranked push', category: 'LFG', game: 'Apex Legends', region: 'NA East', details: 'Need chill comms, diamond+', createdAt: Date.now() - 1000 * 60 * 38 },
  { id: 'seed-2', title: 'Selling mechanical keyboard', category: 'Hardware', game: 'PC Setup', region: 'US Shipping', details: 'Hot-swappable, barely used. Looking for $70.', createdAt: Date.now() - 1000 * 60 * 120 },
  { id: 'seed-3', title: 'New Guild recruiting healers', category: 'Guilds', game: 'World of Warcraft', region: 'NA', details: 'Weekend raids, casual and friendly.', createdAt: Date.now() - 1000 * 60 * 360 },
];

app.use(express.json());
app.use(express.static(__dirname));

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(POSTS_FILE);
  } catch {
    await fs.writeFile(POSTS_FILE, JSON.stringify(seedPosts, null, 2));
  }
}

async function readPosts() {
  await ensureStore();
  const data = await fs.readFile(POSTS_FILE, 'utf8');
  return JSON.parse(data);
}

async function writePosts(posts) {
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function validatePost(body) {
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();
  const game = String(body.game || '').trim();
  const region = String(body.region || '').trim();
  const details = String(body.details || '').trim();

  if (!title || title.length > 80) return 'Title is required and must be 1-80 chars.';
  if (!categories.has(category)) return 'Category is invalid.';
  if (!game || game.length > 40) return 'Game is required and must be 1-40 chars.';
  if (!region || region.length > 40) return 'Region is required and must be 1-40 chars.';
  if (!details || details.length > 400) return 'Details are required and must be 1-400 chars.';

  return null;
}

app.get('/api/posts', async (req, res) => {
  const posts = await readPosts();
  res.json(posts.sort((a, b) => b.createdAt - a.createdAt));
});

app.post('/api/posts', async (req, res) => {
  const error = validatePost(req.body);
  if (error) return res.status(400).json({ error });

  const posts = await readPosts();
  const post = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: req.body.title.trim(),
    category: req.body.category,
    game: req.body.game.trim(),
    region: req.body.region.trim(),
    details: req.body.details.trim(),
    createdAt: Date.now(),
  };

  posts.push(post);
  await writePosts(posts);
  res.status(201).json(post);
});

app.listen(PORT, async () => {
  await ensureStore();
  console.log(`GameList backend running at http://localhost:${PORT}`);
});
