const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const categories = new Set(['LFG', 'Trades', 'Guilds', 'Esports', 'Hardware', 'General']);

const posts = [
  {
    id: 1,
    title: 'LF2 for ranked push',
    category: 'LFG',
    game: 'Apex Legends',
    region: 'NA East',
    details: 'Need chill comms, diamond+',
    createdAt: Date.now() - 1000 * 60 * 38,
  },
  {
    id: 2,
    title: 'Selling mechanical keyboard',
    category: 'Hardware',
    game: 'PC Setup',
    region: 'US Shipping',
    details: 'Hot-swappable, barely used. Looking for $70.',
    createdAt: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 3,
    title: 'New Guild recruiting healers',
    category: 'Guilds',
    game: 'World of Warcraft',
    region: 'NA',
    details: 'Weekend raids, casual and friendly.',
    createdAt: Date.now() - 1000 * 60 * 360,
  },
];

let nextId = posts.length + 1;

function validatePost(body) {
  const required = ['title', 'category', 'game', 'region', 'details'];
  for (const field of required) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `${field} is required`;
    }
  }
  if (!categories.has(body.category)) return 'Invalid category';
  if (body.title.length > 80 || body.game.length > 40 || body.region.length > 40 || body.details.length > 400) {
    return 'One or more fields exceed max length';
  }
  return null;
}

app.get('/api/categories', (_req, res) => {
  res.json(['All', ...categories]);
});

app.get('/api/posts', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || 'All').toString();

  const result = posts
    .filter((p) => category === 'All' || p.category === category)
    .filter((p) => {
      if (!q) return true;
      const text = `${p.title} ${p.game} ${p.region} ${p.details}`.toLowerCase();
      return text.includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(result);
});

app.post('/api/posts', (req, res) => {
  const error = validatePost(req.body || {});
  if (error) return res.status(400).json({ error });

  const post = {
    id: nextId++,
    title: req.body.title.trim(),
    category: req.body.category,
    game: req.body.game.trim(),
    region: req.body.region.trim(),
    details: req.body.details.trim(),
    createdAt: Date.now(),
  };

  posts.push(post);
  res.status(201).json(post);
});

app.listen(PORT, () => {
  console.log(`GameList backend running on http://localhost:${PORT}`);
});
