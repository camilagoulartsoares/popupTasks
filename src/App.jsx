import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";
const MIN_KEY = "popupTasksMinimized";
const CONTAINER_ID = "popup-tasks-widget";

function getCategory(text) {
  const t = (text || "").trim().toLowerCase();
  if (t.startsWith("bug:") || t.startsWith("bug ")) return "bug";
  if (t.startsWith("feature:") || t.startsWith("feature ")) return "feature";
  if (t.startsWith("design:") || t.startsWith("design ")) return "design";
  return "outros";
}

function labelCategory(cat) {
  if (cat === "bug") return "🐛 BUG";
  if (cat === "feature") return "✨ Feature";
  if (cat === "design") return "🎨 Design";
  return "📌 Outros";
}

function App({ onClose }) {
  const [hydrated, setHydrated] = useState(false);
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef(null);

  const [collapsed, setCollapsed] = useState({
    bug: false,
    feature: false,
    design: false,
    outros: false
  });

  useEffect(() => {
    if (!chrome?.storage?.local) {
      setHydrated(true);
      return;
    }

    chrome.storage.local.get([STORAGE_KEY, MIN_KEY], res => {
      const storedTodos = res?.[STORAGE_KEY];
      const storedMin = res?.[MIN_KEY];

      if (Array.isArray(storedTodos)) setTodos(storedTodos);
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
        width: "420px",
        height: "560px",
        maxHeight: "560px",
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
        createdAt: Date.now()
      },
      ...prev
    ]);

    setInput("");
  }

  function toggleTodo(id) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
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

  const remaining = todos.filter(t => !t.done).length;

  const grouped = useMemo(() => {
    const base = { bug: [], feature: [], design: [], outros: [] };
    for (const t of todos) base[getCategory(t.text)].push(t);

    const sortFn = (a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    };

    base.bug.sort(sortFn);
    base.feature.sort(sortFn);
    base.design.sort(sortFn);
    base.outros.sort(sortFn);

    return base;
  }, [todos]);

  if (isMinimized) {
    return (
      <div className="app is-minimized">
        <button className="minimized-fab" onClick={() => setIsMinimized(false)} title="Abrir" aria-label="Abrir">
          📝
        </button>
      </div>
    );
  }

  const groupOrder = ["bug", "feature", "design", "outros"];

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-group">
          <h1>Tarefas</h1>
          <span className="badge">{remaining} pendentes</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => setIsMinimized(true)} title="Minimizar" aria-label="Minimizar">
            ▾
          </button>
          <button className="icon-btn" onClick={onClose} title="Fechar" aria-label="Fechar">
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
          <button type="submit" aria-label="Adicionar">
            +
          </button>
        </form>

        <ul className="todo-list">
          {groupOrder.map(cat => {
            const list = grouped[cat];
            if (!list.length) return null;

            const isCollapsed = !!collapsed[cat];

            return (
              <li key={cat} className={`group group-${cat}`}>
                <div
                  className="group-header"
                  onClick={() => setCollapsed(s => ({ ...s, [cat]: !s[cat] }))}
                  role="button"
                  tabIndex={0}
                >
                  <div className="group-left">
                    <div className="chev">{isCollapsed ? "▸" : "▾"}</div>
                    <div className="group-title">{labelCategory(cat)}</div>
                  </div>
                  <div className="group-pill">{list.length}</div>
                </div>

                <div className={`group-body ${isCollapsed ? "collapsed" : ""}`}>
                  {list.map(todo => (
                    <div key={todo.id} className={`todo-item ${todo.done ? "done" : ""}`}>
                      <span className={`cat-dot dot-${cat}`} />
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
                        <span className="text" onClick={() => startEdit(todo)}>
                          {todo.text}
                        </span>
                      )}

                      <button
                        className="delete"
                        onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))}
                        title="Excluir"
                        aria-label="Excluir"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}

          {todos.length === 0 && <li className="empty">Sem tarefas por enquanto ✨</li>}
        </ul>
      </div>
    </div>
  );
}

export default App;
