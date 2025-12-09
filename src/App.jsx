import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("popupTasks");
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("popupTasks", JSON.stringify(todos));
  }, [todos]);

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>PopupTasks</h1>
        <span className="badge">{remaining} pendente(s)</span>
      </header>

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
  );
}

export default App;
