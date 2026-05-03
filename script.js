const seedPosts = [
  { title: 'LF2 for ranked push', category: 'LFG', game: 'Apex Legends', region: 'NA East', details: 'Need chill comms, diamond+', createdAt: Date.now() - 1000 * 60 * 38 },
  { title: 'Selling mechanical keyboard', category: 'Hardware', game: 'PC Setup', region: 'US Shipping', details: 'Hot-swappable, barely used. Looking for $70.', createdAt: Date.now() - 1000 * 60 * 120 },
  { title: 'New Guild recruiting healers', category: 'Guilds', game: 'World of Warcraft', region: 'NA', details: 'Weekend raids, casual and friendly.', createdAt: Date.now() - 1000 * 60 * 360 },
];

const categories = ['All', 'LFG', 'Trades', 'Guilds', 'Esports', 'Hardware', 'General'];
let posts = JSON.parse(localStorage.getItem('gamelist.posts') || 'null') || seedPosts;
let activeFilter = 'All';

const postsEl = document.getElementById('posts');
const formEl = document.getElementById('postForm');
const filtersEl = document.getElementById('filters');
const searchEl = document.getElementById('search');
const tpl = document.getElementById('postTemplate');

function timeAgo(ts) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function renderFilters() {
  filtersEl.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip filter ${activeFilter === cat ? 'active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => {
      activeFilter = cat;
      renderFilters();
      renderPosts();
    };
    filtersEl.appendChild(btn);
  });
}

function matches(post, q) {
  const text = `${post.title} ${post.game} ${post.region} ${post.details}`.toLowerCase();
  return text.includes(q.toLowerCase());
}

function renderPosts() {
  const q = searchEl.value.trim();
  const visible = posts
    .filter((p) => activeFilter === 'All' || p.category === activeFilter)
    .filter((p) => !q || matches(p, q))
    .sort((a, b) => b.createdAt - a.createdAt);

  postsEl.innerHTML = '';
  if (!visible.length) {
    postsEl.innerHTML = '<li class="post">No posts match this filter yet.</li>';
    return;
  }

  visible.forEach((post) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('h3').textContent = post.title;
    node.querySelector('.category').textContent = post.category;
    node.querySelector('.game').textContent = post.game;
    node.querySelector('.region').textContent = `Region: ${post.region}`;
    node.querySelector('.details').textContent = post.details;
    node.querySelector('.time').textContent = timeAgo(post.createdAt);
    postsEl.appendChild(node);
  });
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const post = {
    title: document.getElementById('title').value.trim(),
    category: document.getElementById('category').value,
    game: document.getElementById('game').value.trim(),
    region: document.getElementById('region').value.trim(),
    details: document.getElementById('details').value.trim(),
    createdAt: Date.now(),
  };

  posts.push(post);
  localStorage.setItem('gamelist.posts', JSON.stringify(posts));
  formEl.reset();
  renderPosts();
});

searchEl.addEventListener('input', renderPosts);

renderFilters();
renderPosts();
