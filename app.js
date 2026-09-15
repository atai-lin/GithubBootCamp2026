// 待辦清單應用程式，使用原生 JavaScript 與 localStorage 儲存資料。
const STORAGE_KEY = 'todo-list-items';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const filterButtons = document.querySelectorAll('.filter-button');

const THEME_STORAGE_KEY = 'todo-list-theme';
const FILTER_STORAGE_KEY = 'todo-list-filter';
const VALID_FILTERS = ['all', 'active', 'completed'];
const EMPTY_MESSAGES = {
  all: '還沒有任何待辦事項,新增一個吧!',
  active: '目前沒有未完成的待辦事項。',
  completed: '目前沒有已完成的待辦事項。',
};

function getSavedFilter() {
  const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
  return VALID_FILTERS.includes(savedFilter) ? savedFilter : 'all';
}

let currentFilter = getSavedFilter();

// 從 localStorage 讀取資料，資料格式不正確時使用空陣列。
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    const todos = savedTodos ? JSON.parse(savedTodos) : [];
    return Array.isArray(todos) ? todos : [];
  } catch (error) {
    console.warn('讀取待辦清單失敗，將以空清單開始。', error);
    return [];
  }
}

let todos = loadTodos();

// 套用主題並更新切換按鈕的圖示與文字。
function applyTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  } else {
    delete document.documentElement.dataset.theme;
  }

  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-label', isDark ? '切換淺色模式' : '切換深色模式');
}

// 將目前的待辦清單儲存到 localStorage。
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 產生每筆待辦事項專用的識別碼。
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function saveCurrentFilter() {
  localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
}

function syncFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

// 根據資料重新繪製畫面。
function render() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `完成「${todo.text}」`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = EMPTY_MESSAGES[currentFilter];
  syncFilterButtons();
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
}

// 新增一筆非空白待辦事項。
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  todos.push({
    id: createId(),
    text,
    completed: false,
  });
  saveTodos();
  render();
  input.value = '';
  input.focus();
});

// 使用事件委派處理勾選與刪除。
list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;

  const todo = todos.find((currentTodo) => currentTodo.id === item.dataset.id);
  if (!todo) return;

  if (event.target.matches('input[type="checkbox"]')) {
    todo.completed = event.target.checked;
  } else if (event.target.matches('.btn-delete')) {
    todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
  } else {
    return;
  }

  saveTodos();
  render();
});

// 切換淺色與深色模式，手動選擇會覆蓋系統設定並保存。
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark'
    || (!document.documentElement.dataset.theme
      && window.matchMedia('(prefers-color-scheme: dark)').matches);
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'light' : 'dark');
  applyTheme();
});

// 切換清單篩選，未完成數量仍以完整資料計算。
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    saveCurrentFilter();
    render();
  });
});

applyTheme();
render();
