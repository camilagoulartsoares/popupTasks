import { useEffect, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";
const THEME_KEY = "popupTasksTheme";
const MIN_KEY = "popupTasksMinimized";

function App({ onClose }) {
  const [hydrated, setHydrated] = useState(false);

  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const [theme, setTheme] = useState(() => {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    if (!chrome?.storage?.local) {
      setHydrated(true);
      return;
    }

    chrome.storage.local.get([STORAGE_KEY, THEME_KEY, MIN_KEY], result => {
      const storedTodos = result?.[STORAGE_KEY];
      const storedTheme = result?.[THEME_KEY];
      const storedMin = result?.[MIN_KEY];

      if (Array.isArray(storedTodos)) {
        const normalized = storedTodos.map(t => ({
          ...t,
          priority: t?.priority || "media"
        }));
        setTodos(normalized);
      }

      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }

      if (typeof storedMin === "boolean") {
        setIsMinimized(storedMin);
      }

      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [STORAGE_KEY]: todos });
  }, [todos, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [THEME_KEY]: theme });
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [MIN_KEY]: isMinimized });
  }, [isMinimized, hydrated]);

  useEffect(() => {
    if (!chrome?.storage?.onChanged) return;

    const handleChange = (changes, area) => {
      if (area !== "local") return;

      if (changes[STORAGE_KEY]) {
        const next = changes[STORAGE_KEY].newValue;
        if (Array.isArray(next)) {
          const normalized = next.map(t => ({
            ...t,
            priority: t?.priority || "media"
          }));

          setTodos(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(normalized);
            return prevStr === nextStr ? prev : normalized;
          });
        }
      }

      if (changes[THEME_KEY]) {
        const next = changes[THEME_KEY].newValue;
        if (next === "light" || next === "dark") setTheme(next);
      }

      if (changes[MIN_KEY]) {
        const next = changes[MIN_KEY].newValue;
        if (typeof next === "boolean") setIsMinimized(next);
      }
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const newTodo = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text,
      done: false,
      priority: "media",
      createdAt: Date.now()
    };

    setTodos(prev => [newTodo, ...prev]);
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

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function removeTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (editingId === id) cancelEdit();
  }

  function saveEdit() {
    if (editingId === null) return;

    const next = editingText.trim();
    if (!next) {
      removeTodo(editingId);
      return;
    }

    setTodos(prev =>
      prev.map(t => (t.id === editingId ? { ...t, text: next } : t))
    );
    setEditingId(null);
    setEditingText("");
  }

  function handleEditKeyDown(e) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done));
  }

  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  function toggleMinimize() {
    setIsMinimized(prev => !prev);
  }

  function handleMinimizeContext(e) {
    e.preventDefault();
    if (isMinimized && onClose) onClose();
  }

  const remaining = todos.filter(t => !t.done).length;

  return (
    <div className={`app theme-${theme} ${isMinimized ? "is-minimized" : ""}`}>
      <header className="app-header">
        <div className="title-group">
          <h1>PopupTasks</h1>
          <span className="badge">{remaining} pendente(s)</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={toggleTheme}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button
            className="icon-btn minimize-btn"
            onClick={toggleMinimize}
            onContextMenu={handleMinimizeContext}
          >
            {isMinimized ? "📝" : "▾"}
          </button>

          {!isMinimized && (
            <button className="icon-btn" onClick={onClose}>
              ×
            </button>
          )}
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
              className={`todo-item ${todo.done ? "done" : ""}`}
              onDoubleClick={() => startEdit(todo)}
            >
              <button
                className={`priority-dot priority-${todo.priority || "media"}`}
                onClick={() => cyclePriority(todo.id)}
                title={`Prioridade: ${todo.priority || "media"}`}
                disabled={editingId === todo.id}
              />

              <button
                className="check"
                onClick={() => toggleTodo(todo.id)}
                disabled={editingId === todo.id}
              >
                {todo.done ? "✔" : ""}
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
                <span className="text" onClick={() => startEdit(todo)}>
                  {todo.text}
                </span>
              )}

              <button className="delete" onClick={() => removeTodo(todo.id)}>
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
