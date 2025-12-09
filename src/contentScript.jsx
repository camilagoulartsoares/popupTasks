import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const CONTAINER_ID = "popup-tasks-widget";

function injectApp() {
  if (document.getElementById(CONTAINER_ID)) return;

  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  document.body.appendChild(container);

  Object.assign(container.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    width: "320px",
    zIndex: "2147483647",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#f9fafb"
  });

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

injectApp();
