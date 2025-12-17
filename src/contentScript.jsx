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
    bottom: "12px",
    right: "12px",
    width: "320px",
    zIndex: "2147483647",
    background: "transparent",
    margin: "0",
    padding: "0",
    boxShadow: "none",
    borderRadius: "0",
    overflow: "visible"
  });


  const root = ReactDOM.createRoot(container);

  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    <React.StrictMode>
      <App onClose={handleClose} />
    </React.StrictMode>
  );
}

injectApp();
