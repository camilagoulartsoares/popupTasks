import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "popupTasks";

function App({ onClose }) {
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");

  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("popupTasksTheme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    } catch {
      return "light";
    }
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const savedMin = localStorage.getItem("popupTasksMinimized");
      return savedMin === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (!chrome?.storage?.sync) return;

      chrome.storage.sync.get([STORAGE_KEY], result => {
        const stored = result?.[STORAGE_KEY];
        if (Array.isArray(stored)) {
          setTodos(stored);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {}

    try {
      if (!chrome?.storage?.sync) return;
      chrome.storage.sync.set({ [STORAGE_KEY]: todos });
    } catch {}
  }, [todos]);

  useEffect(() => {
    try {
      if (!chrome?.storage?.onChanged) return;

      const handleChange = (changes, area) => {
        if (area !== "sync") return;

        const change = changes[STORAGE_KEY];
        if (!change) return;

        const newTodos = change.newValue;
        if (!Array.isArray(newTodos)) return;

        setTodos(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(newTodos);
          if (prevStr === nextStr) return prev;
          return newTodos;
        });

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos));
        } catch {}
      };

      chrome.storage.onChanged.addListener(handleChange);

      return () => chrome.storage.onChanged.removeListener(handleChange);
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = event => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        if (!Array.isArray(parsed)) return;

        setTodos(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(parsed);
          if (prevStr === nextStr) return prev;
          return parsed;
        });
      } catch {}
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("popupTasksTheme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "popupTasksMinimized",
        isMinimized ? "true" : "false"
      );
    } catch {}
  }, [isMinimized]);

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: input.trim(),
      done: false
    };

    setTodos([newTodo, ...todos]);
    setInput("");
  }

  function toggleTodo(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTodo(id) {
    setTodos(todos.filter(t => t.id !== id));
  }

  function clearDone() {
    setTodos(todos.filter(t => !t.done));
  }

  const remaining = todos.filter(t => !t.done).length;

  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  function toggleMinimize() {
    setIsMinimized(prev => !prev);
  }

  function handleMinimizeContext(e) {
    e.preventDefault();
    if (isMinimized && onClose) {
      onClose();
    }
  }

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
            <li key={todo.id} className={`todo-item ${todo.done ? "done" : ""}`}>
              <button className="check" onClick={() => toggleTodo(todo.id)}>
                {todo.done ? "✔" : ""}
              </button>
              <span className="text">{todo.text}</span>
              <button className="delete" onClick={() => removeTodo(todo.id)}>
                ×
              </button>
            </li>
          ))}

          {todos.length === 0 && (
            <li className="empty">Sem tarefas por enquanto ✨</li>
          )}
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
