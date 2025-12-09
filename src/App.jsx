import { useEffect, useState } from "react";
import "./App.css";

function App({ onClose }) {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState("light");
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("popupTasks");
    if (saved) {
      setTodos(JSON.parse(saved));
    }

    const savedTheme = localStorage.getItem("popupTasksTheme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    const savedMin = localStorage.getItem("popupTasksMinimized");
    if (savedMin === "true") setIsMinimized(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("popupTasks", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("popupTasksTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("popupTasksMinimized", isMinimized ? "true" : "false");
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
            aria-label={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? "📝" : "▾"}

          </button>

          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label="Fechar widget"
          >
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
