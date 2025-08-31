import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installGlobalErrorHandler } from "./lib/error-handler";
import { installOverlayBlocker } from "./lib/overlay-blocker";

// Install global error handler to prevent runtime error overlays for fetch issues
installGlobalErrorHandler();

// Install overlay blocker to hide any runtime overlays that still appear
installOverlayBlocker();

createRoot(document.getElementById("root")!).render(<App />);
