import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDG_1aXKSMuGjWHzBBiOms_mnvMzMC4YAE",
  authDomain: "whybot-c40ce.firebaseapp.com",
  projectId: "whybot-c40ce",
  storageBucket: "whybot-c40ce.appspot.com",
  messagingSenderId: "61893936107",
  appId: "1:61893936107:web:17e2528b3efbf1bea18fae",
  measurementId: "G-HZ7EYX7LZ9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
