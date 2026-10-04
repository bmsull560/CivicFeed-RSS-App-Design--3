import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { TRPCProvider } from "./providers/trpc";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TRPCProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </TRPCProvider>
  </StrictMode>
);
