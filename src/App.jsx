import { useEffect, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";
const THEME_KEY = "popupTasksTheme";
const MIN_KEY = "popupTasksMinimized";
const CONTAINER_ID = "popup-tasks-widget";

function sortTodos(list) {
  const priorityRank = { alta: 0, media: 1, baixa: 2 };

  return [...list].sort((a, b) => {
    const pA = a?.priority || "media";
    const pB = b?.priority || "media";
    const pDiff = priorityRank[pA] - priorityRank[pB];
    if (pDiff !== 0) return pDiff;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function App({ onClose }) {
  const [hydrated, setHydrated] = useState(false);
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const [theme, setTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [isMinimized, setIsMinimized] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY, THEME_KEY, MIN_KEY], res => {
      if (Array.isArray(res[STORAGE_KEY])) setTodos(res[STORAGE_KEY]);
      if (res[THEME_KEY]) setTheme(res[THEME_KEY]);
      if (typeof res[MIN_KEY] === "boolean") setIsMinimized(res[MIN_KEY]);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) chrome.storage.local.set({ [STORAGE_KEY]: todos });
  }, [todos, hydrated]);

  useEffect(() => {
    if (hydrated) chrome.storage.local.set({ [THEME_KEY]: theme });
  }, [theme, hydrated]);

  useEffect(() => {
    if (hydrated) chrome.storage.local.set({ [MIN_KEY]: isMinimized });
  }, [isMinimized, hydrated]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    Object.assign(container.style, isMinimized ? {
      width: "48px",
      height: "48px"
    } : {
      width: "340px",
      height: "320px"
    });
  }, [isMinimized]);

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setTodos(prev => [{
      id: crypto.randomUUID(),
      text: input,
      done: false,
      priority: "media",
      createdAt: Date.now()
    }, ...prev]);

    setInput("");
  }

  if (isMinimized) {
    return (
      <div className={`app theme-${theme} is-minimized`}>
        <button className="minimized-fab" onClick={() => setIsMinimized(false)}>
          <svg className="fab-svg" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M9 6h10a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Zm0 6h10a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Zm0 6h10a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2ZM5 6a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 5 6Zm0 6a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 5 12Zm0 6a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 5 18Z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <h1>PopupTasks</h1>
        <div>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setIsMinimized(true)}>▾</button>
          <button onClick={onClose}>×</button>
        </div>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit">+</button>
      </form>

      <ul className="todo-list">
        {sortTodos(todos).map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
