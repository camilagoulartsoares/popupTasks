import { useEffect, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";
const THEME_KEY = "popupTasksTheme";
const MIN_KEY = "popupTasksMinimized";

function App({ onClose }) {
  const [hydrated, setHydrated] = useState(false);
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    if (!chrome?.storage?.local) {
      setHydrated(true);
      return;
    }

    chrome.storage.local.get([STORAGE_KEY, THEME_KEY, MIN_KEY], res => {
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
    });
  }, []);

  useEffect(() => {
    if (hydrated && chrome?.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: todos });
    }
  }, [todos, hydrated]);

  useEffect(() => {
    if (hydrated && chrome?.storage?.local) {
      chrome.storage.local.set({ [THEME_KEY]: theme });
    }
  }, [theme, hydrated]);

  useEffect(() => {
    if (hydrated && chrome?.storage?.local) {
      chrome.storage.local.set({ [MIN_KEY]: isMinimized });
    }
  }, [isMinimized, hydrated]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
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

  function toggleTodo(id) {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function cyclePriority(id) {
    const order = ["baixa", "media", "alta"];
    setTodos(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const next = order[(order.indexOf(t.priority) + 1) % order.length];
        return { ...t, priority: next };
      })
    );
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function saveEdit() {
    if (!editingId) return;
    const text = editingText.trim();

    if (!text) {
      setTodos(prev => prev.filter(t => t.id !== editingId));
    } else {
      setTodos(prev =>
        prev.map(t => (t.id === editingId ? { ...t, text } : t))
      );
    }

    setEditingId(null);
    setEditingText("");
  }

  function handleEditKeyDown(e) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingId(null);
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done));
  }

  const remaining = todos.filter(t => !t.done).length;

  return (
    <div className={`app theme-${theme} ${isMinimized ? "is-minimized" : ""}`}>
      <header className="app-header">
        <div className="title-group">
          <h1>PopupTasks</h1>
          <span className="badge">{remaining} pendente(s)</span>
        </div>
      </header>

      <div className="app-content">
        <form className="add-form" onSubmit={handleAdd}>
          <input
            placeholder="Nova tarefa..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit">+</button>
        </form>

        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className="todo-item">
              {/* MINI BOLINHA */}
              <span
                className={`priority-dot priority-${todo.priority}`}
                onClick={() => cyclePriority(todo.id)}
                title="Mudar prioridade"
              />

              {/* CHECK */}
              <button
                className={`check ${todo.done ? "is-done" : ""}`}
                onClick={() => toggleTodo(todo.id)}
                title="Concluir"
              >
                {todo.done ? "✔" : ""}
              </button>

              <span className="text" onDoubleClick={() => startEdit(todo)}>
                {todo.text}
              </span>

              <button className="delete" onClick={() => setTodos(t => t.filter(x => x.id !== todo.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>

        {todos.some(t => t.done) && (
          <button className="clear-done" onClick={clearDone}>
            Limpar concluídas
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
