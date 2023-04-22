import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Flow, FlowProvider } from "./Flow";

function App() {
  return (
    <>
      <FlowProvider />
    </>
  );
}

export default App;
