const categories = ['All', 'LFG', 'Trades', 'Guilds', 'Esports', 'Hardware', 'General'];
let posts = [];
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
    .filter((p) => !q || matches(p, q));

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

async function loadPosts() {
  const resp = await fetch('/api/posts');
  posts = await resp.json();
  renderPosts();
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const post = {
    title: document.getElementById('title').value.trim(),
    category: document.getElementById('category').value,
    game: document.getElementById('game').value.trim(),
    region: document.getElementById('region').value.trim(),
    details: document.getElementById('details').value.trim(),
  };

  const resp = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });

  if (!resp.ok) {
    const err = await resp.json();
    alert(err.error || 'Failed to create post.');
    return;
  }

  formEl.reset();
  await loadPosts();
});

searchEl.addEventListener('input', renderPosts);

renderFilters();
loadPosts();
