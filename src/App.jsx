import { useEffect, useState } from "react";
import "./App.css";

function App({ onClose }) {
  // Carrega tarefas diretamente do localStorage (sem piscar)
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("popupTasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");

  // Tema: tenta carregar, se não tiver usa prefers-color-scheme
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

  // Estado minimizado: já começa do valor salvo
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const savedMin = localStorage.getItem("popupTasksMinimized");
      return savedMin === "true";
    } catch {
      return false;
    }
  });

  // Salva tarefas
  useEffect(() => {
    try {
      localStorage.setItem("popupTasks", JSON.stringify(todos));
    } catch {
      // ignora erros de storage
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

  // Clique com botão direito no ícone minimizado → fecha o widget de vez
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

          {/* X só aparece quando está aberto */}
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

      {/* Conteúdo some no modo minimizado via CSS (.app.is-minimized .app-content ...) */}
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
