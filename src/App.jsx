import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <h1>Postcards from Outside</h1>;
}

// Entry point: this file mounts itself (there is no main.jsx).
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
