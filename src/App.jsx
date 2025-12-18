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
    const pDiff = (priorityRank[pA] ?? 1) - (priorityRank[pB] ?? 1);
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
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    chrome?.storage?.local?.get(
      [STORAGE_KEY, THEME_KEY, MIN_KEY],
      res => {
        if (Array.isArray(res?.[STORAGE_KEY])) {
          setTodos(
            res[STORAGE_KEY].map(t => ({
              ...t,
              priority: t.priority || "media"
            }))
          );
        }
        if (res?.[THEME_KEY]) setTheme(res[THEME_KEY]);
        if (typeof res?.[MIN_KEY] === "boolean") setIsMinimized(res[MIN_KEY]);
        setHydrated(true);
      }
    );
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
    editInputRef.current?.focus();
  }, [editingId]);

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setTodos(prev => [
      {
        id: crypto.randomUUID(),
        text: input.trim(),
        done: false,
        priority: "media",
        createdAt: Date.now()
      },
      ...prev
    ]);
    setInput("");
  }

  function saveEdit() {
    if (!editingId) return;
    const text = editingText.trim();
    setTodos(prev =>
      text
        ? prev.map(t => (t.id === editingId ? { ...t, text } : t))
        : prev.filter(t => t.id !== editingId)
    );
    setEditingId(null);
    setEditingText("");
  }

  const orderedTodos = sortTodos(todos);
  const remaining = todos.filter(t => !t.done).length;

  if (isMinimized) {
    return (
      <div className={`app theme-${theme} is-minimized`}>
        <button className="minimized-fab" onClick={() => setIsMinimized(false)}>
          📝
        </button>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <div>
          <h1>PopupTasks</h1>
          <span className="badge">{remaining} pendente(s)</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="icon-btn" onClick={() => setIsMinimized(true)}>▾</button>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          placeholder="Nova tarefa..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">+</button>
      </form>

      <ul className="todo-list">
        {orderedTodos.map(todo => (
          <li key={todo.id} className={`todo-item priority-${todo.priority} ${todo.done ? "done" : ""}`}>
            <button className="priority-dot" />
            <button
              className={`check ${todo.done ? "is-done" : ""}`}
              onClick={() =>
                setTodos(prev =>
                  prev.map(t => (t.id === todo.id ? { ...t, done: !t.done } : t))
                )
              }
            >
              {todo.done && "✓"}
            </button>

            {editingId === todo.id ? (
              <input
                ref={editInputRef}
                className="edit-input"
                value={editingText}
                onChange={e => setEditingText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === "Enter" && saveEdit()}
              />
            ) : (
              <span className="text" onClick={() => {
                setEditingId(todo.id);
                setEditingText(todo.text);
              }}>
                {todo.text}
              </span>
            )}

            <button
              className="delete"
              onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {todos.some(t => t.done) && (
        <button className="clear-done" onClick={() => setTodos(t => t.filter(x => !x.done))}>
          <span className="clear-ico">🧹</span>
          Limpar concluídas
        </button>
      )}
    </div>
  );
}

export default App;
