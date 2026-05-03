const seedPosts = [
  {
    id: crypto.randomUUID(),
    title: 'FromSoftware confirms Elden Ring DLC balance patch',
    game: 'Elden Ring',
    url: 'https://www.fromsoftware.jp',
    text: 'PvP poise math changes look huge for arena builds.',
    type: 'top',
    points: 182,
    author: 'pixelbard',
    createdAt: Date.now() - 1000 * 60 * 52,
    comments: ['Finally greatswords are back.', 'Need full patch notes ASAP.'],
  },
  {
    id: crypto.randomUUID(),
    title: 'Ask: Best co-op roguelites for 3 players?',
    game: 'General',
    url: '',
    text: 'Looking for runs under 45 mins and controller support.',
    type: 'ask',
    points: 77,
    author: 'raidmom',
    createdAt: Date.now() - 1000 * 60 * 125,
    comments: ['Ember Knights', 'Roboquest with scaling mods'],
  },
  {
    id: crypto.randomUUID(),
    title: 'Steam Deck OLED battery tweak guide is incredible',
    game: 'Steam Deck',
    url: 'https://store.steampowered.com',
    text: 'Got 18% more runtime in Hades II on my profile.',
    type: 'new',
    points: 41,
    author: 'voltgrip',
    createdAt: Date.now() - 1000 * 60 * 18,
    comments: [],
  },
];

const storageKey = 'gamenews.posts';
let posts = JSON.parse(localStorage.getItem(storageKey) || 'null') || seedPosts;
let activeTab = 'top';

const postsEl = document.getElementById('posts');
const postForm = document.getElementById('postForm');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');
const postTpl = document.getElementById('postTemplate');

function timeAgo(ts) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

function hostName(url) {
  if (!url) return '';
  try {
    return `(${new URL(url).hostname.replace('www.', '')})`;
  } catch {
    return '';
  }
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(posts));
}

function filteredPosts() {
  const q = searchEl.value.trim().toLowerCase();
  return posts
    .filter((post) => activeTab === 'top' || post.type === activeTab)
    .filter((post) => {
      if (!q) return true;
      return `${post.title} ${post.game} ${post.text}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (activeTab === 'new') return b.createdAt - a.createdAt;
      return b.points - a.points;
    });
}

function drawComments(wrapper, comments) {
  wrapper.innerHTML = comments.map((line) => `<p class="comment">${line}</p>`).join('');
}

function render() {
  const visible = filteredPosts();
  countEl.textContent = `${visible.length} posts`;
  postsEl.innerHTML = '';

  visible.forEach((post) => {
    const node = postTpl.content.cloneNode(true);
    const root = node.querySelector('.item');
    const titleEl = node.querySelector('.title');
    const hostEl = node.querySelector('.host');
    const metaEl = node.querySelector('.meta');
    const textEl = node.querySelector('.text');
    const commentsEl = node.querySelector('.comments');
    const toggleCommentsEl = node.querySelector('.toggle-comments');
    const formEl = node.querySelector('.comment-form');
    const inputEl = node.querySelector('.comment-input');
    const voteBtn = node.querySelector('.vote');

    titleEl.textContent = `[${post.game}] ${post.title}`;
    titleEl.href = post.url || '#';
    hostEl.textContent = hostName(post.url);
    metaEl.textContent = `${post.points} points by ${post.author} ${timeAgo(post.createdAt)}`;
    textEl.textContent = post.text;

    drawComments(commentsEl, post.comments);
    toggleCommentsEl.textContent = `${post.comments.length} comments`;

    voteBtn.onclick = () => {
      post.points += 1;
      save();
      render();
    };

    toggleCommentsEl.onclick = () => {
      commentsEl.classList.toggle('hidden');
      formEl.classList.toggle('hidden');
    };

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      post.comments.push(inputEl.value.trim());
      inputEl.value = '';
      drawComments(commentsEl, post.comments);
      toggleCommentsEl.textContent = `${post.comments.length} comments`;
      save();
    });

    root.dataset.id = post.id;
    postsEl.appendChild(node);
  });
}

document.querySelectorAll('.tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    activeTab = tabBtn.dataset.tab;
    document.querySelectorAll('.tab').forEach((btn) => btn.classList.remove('active'));
    tabBtn.classList.add('active');
    render();
  });
});

postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const game = document.getElementById('game').value.trim();
  const url = document.getElementById('url').value.trim();
  const text = document.getElementById('text').value.trim();

  posts.push({
    id: crypto.randomUUID(),
    title,
    game,
    url,
    text,
    type: text.toLowerCase().startsWith('ask:') ? 'ask' : 'new',
    points: 1,
    author: 'you',
    createdAt: Date.now(),
    comments: [],
  });

  save();
  postForm.reset();
  activeTab = 'new';
  document.querySelectorAll('.tab').forEach((btn) => btn.classList.remove('active'));
  document.querySelector('[data-tab="new"]').classList.add('active');
  render();
});

searchEl.addEventListener('input', render);

render();
