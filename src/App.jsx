import { useEffect, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";
const THEME_KEY = "popupTasksTheme";
const MIN_KEY = "popupTasksMinimized";
const CONTAINER_ID = "popup-tasks-widget";

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
      const storedTodos = res?.[STORAGE_KEY];
      const storedTheme = res?.[THEME_KEY];
      const storedMin = res?.[MIN_KEY];

      if (Array.isArray(storedTodos)) {
        setTodos(
          storedTodos.map(t => ({
            ...t,
            priority: t?.priority || "media"
          }))
        );
      }

      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
      if (typeof storedMin === "boolean") setIsMinimized(storedMin);

      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !chrome?.storage?.local) return;
    chrome.storage.local.set({ [STORAGE_KEY]: todos });
  }, [todos, hydrated]);

  useEffect(() => {
    if (!hydrated || !chrome?.storage?.local) return;
    chrome.storage.local.set({ [THEME_KEY]: theme });
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated || !chrome?.storage?.local) return;
    chrome.storage.local.set({ [MIN_KEY]: isMinimized });
  }, [isMinimized, hydrated]);

  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    if (isMinimized) {
      Object.assign(container.style, {
        width: "48px",
        height: "48px",
        maxHeight: "48px",
        background: "transparent",
        overflow: "visible"
      });
    } else {
      Object.assign(container.style, {
        width: "340px",
        height: "320px",
        maxHeight: "320px",
        background: "transparent",
        overflow: "visible"
      });
    }
  }, [isMinimized]);

  function handleAdd(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setTodos(prev => [
      {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        text,
        done: false,
        priority: "media",
        createdAt: Date.now()
      },
      ...prev
    ]);

    setInput("");
  }

  function toggleTodo(id) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function cyclePriority(id) {
    const order = ["baixa", "media", "alta"];
    setTodos(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const current = t.priority || "media";
        const next = order[(order.indexOf(current) + 1) % order.length];
        return { ...t, priority: next };
      })
    );
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function saveEdit() {
    if (editingId === null) return;
    const next = editingText.trim();

    if (!next) {
      setTodos(prev => prev.filter(t => t.id !== editingId));
    } else {
      setTodos(prev => prev.map(t => (t.id === editingId ? { ...t, text: next } : t)));
    }

    setEditingId(null);
    setEditingText("");
  }

  function handleEditKeyDown(e) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") {
      setEditingId(null);
      setEditingText("");
    }
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done));
  }

  const remaining = todos.filter(t => !t.done).length;

  if (isMinimized) {
    return (
      <div className={`app theme-${theme} is-minimized`}>
        <button className="minimized-fab" onClick={() => setIsMinimized(false)} title="Abrir">
          <span className="fab-icon" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <div className="title-group">
          <h1>PopupTasks</h1>
          <span className="badge">{remaining} pendente(s)</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button className="icon-btn" onClick={() => setIsMinimized(true)} title="Minimizar">
            ▾
          </button>

          <button className="icon-btn" onClick={onClose} title="Fechar">
            ×
          </button>
        </div>
      </header>

      <div className="app-content">
        <form className="add-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Nova tarefa..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit">+</button>
        </form>

        <ul className="todo-list">
          {todos.map(todo => (
            <li
              key={todo.id}
              className={`todo-item priority-${todo.priority || "media"} ${todo.done ? "done" : ""}`}
            >
              {/* bolinha da prioridade (mini) */}
              <button
                className={`priority-dot priority-${todo.priority || "media"}`}
                onClick={() => cyclePriority(todo.id)}
                title="Mudar prioridade"
                disabled={editingId === todo.id}
              />

              {/* círculo do check */}
              <button
                className={`check ${todo.done ? "is-done" : ""}`}
                onClick={() => toggleTodo(todo.id)}
                title="Concluir"
                disabled={editingId === todo.id}
              >
                <span className="checkmark" aria-hidden="true">
                  {todo.done ? "✓" : ""}
                </span>
              </button>

              {editingId === todo.id ? (
                <input
                  ref={editInputRef}
                  className="edit-input"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                />
              ) : (
                <span className="text" onDoubleClick={() => startEdit(todo)} onClick={() => startEdit(todo)}>
                  {todo.text}
                </span>
              )}

              <button
                className="delete"
                onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))}
                title="Excluir"
              >
                ×
              </button>
            </li>
          ))}

          {todos.length === 0 && <li className="empty">Sem tarefas por enquanto ✨</li>}
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
