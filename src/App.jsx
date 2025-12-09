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

  // Carrega versão sincronizada (chrome.storage.sync) ao montar
  useEffect(() => {
    try {
      if (
        typeof chrome === "undefined" ||
        !chrome.storage ||
        !chrome.storage.sync
      ) {
        return;
      }

      chrome.storage.sync.get([STORAGE_KEY], result => {
        try {
          const stored = result?.[STORAGE_KEY];
          if (Array.isArray(stored)) {
            setTodos(stored);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          }
        } catch {
          // ignora
        }
      });
    } catch {
      // ignora
    }
  }, []);

  // Salva tarefas (local + sync entre dispositivos)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // ignora erros de localStorage
    }

    try {
      if (
        typeof chrome === "undefined" ||
        !chrome.storage ||
        !chrome.storage.sync
      ) {
        return;
      }

      chrome.storage.sync.set({ [STORAGE_KEY]: todos });
    } catch {
      // ignora erros de chrome.storage
    }
  }, [todos]);

  // Salva tema
  useEffect(() => {
    try {
      localStorage.setItem("popupTasksTheme", theme);
    } catch {
      // ignora
    }
  }, [theme]);

  // Salva estado minimizado
  useEffect(() => {
    try {
      localStorage.setItem(
        "popupTasksMinimized",
        isMinimized ? "true" : "false"
      );
    } catch {
      // ignora
    }
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
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema claro/escuro"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button
            className="icon-btn minimize-btn"
            type="button"
            onClick={toggleMinimize}
            onContextMenu={handleMinimizeContext}
            aria-label={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? "📝" : "▾"}
          </button>

          {!isMinimized && (
            <button
              className="icon-btn"
              type="button"
              onClick={onClose}
              aria-label="Fechar widget"
            >
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
            >
              <button
                className="check"
                onClick={() => toggleTodo(todo.id)}
                aria-label="Concluir"
              >
                {todo.done ? "✔" : ""}
              </button>
              <span className="text">{todo.text}</span>
              <button
                className="delete"
                onClick={() => removeTodo(todo.id)}
                aria-label="Remover"
              >
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
