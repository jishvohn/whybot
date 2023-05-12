import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// Initialize an agent at application startup.
const fpPromise = FingerprintJS.load({ monitoring: false });

let fingerprint: string | null = null;

export async function getFingerprint() {
  if (fingerprint) {
    return fingerprint;
  }

  const fp = await fpPromise;
  const result = await fp.get();
  fingerprint = result.visitorId;
  return fingerprint;
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
