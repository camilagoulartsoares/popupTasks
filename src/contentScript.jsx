import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const CONTAINER_ID = "popup-tasks-widget";

const container = document.createElement("div");
container.id = CONTAINER_ID;

Object.assign(container.style, {
  position: "fixed",
  bottom: "12px",
  right: "12px",
  zIndex: "2147483647"
});

document.body.appendChild(container);

const root = ReactDOM.createRoot(container);
root.render(<App onClose={() => {
  root.unmount();
  container.remove();
}} />);
