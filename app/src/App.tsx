import { useState } from "react";
import "./index.css";
import GraphPage from "./GraphPage";
import { PERSONAS } from "./personas";
import { GraphPageExample } from "./GraphPageExample";
import { MODELS } from "./models";
import { ApiKey } from "./APIKeyModal";
import { v4 as uuidv4 } from "uuid";
import {
  getApiKeyFromLocalStorage,
  getUserIdFromLocalStorage,
  getUserIdOrCreateFromLocalStorage,
} from "./util/localStorage";
import StartPage, { Example } from "./StartPage";
import {
  RouterProvider,
  createBrowserRouter,
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import AboutPage from "./AboutPage";

function App() {
  const [seedQuery, setSeedQuery] = useState<string>();
  const [model, setModel] = useState(Object.keys(MODELS)[0]);
  const [persona, setPersona] = useState(Object.keys(PERSONAS)[0]);
  const [apiKey, setApiKey] = useState<ApiKey>(getApiKeyFromLocalStorage());
  const [example, setExample] = useState<Example>();
  const [userId] = useState<string>(getUserIdOrCreateFromLocalStorage());

  return (
    <Router>
      <div className="text-white bg-zinc-700">
        {example ? (
          <div className="text-white bg-zinc-700 h-screen w-screen fixed left-0 top-0">
            <GraphPageExample
              example={example}
              onExit={() => {
                setSeedQuery("");
                setExample(undefined);
              }}
            />
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-white bg-zinc-700 min-h-screen flex flex-col">
                  <StartPage
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    model={model}
                    persona={persona}
                    onSetModel={setModel}
                    onSetPersona={setPersona}
                    onSetExample={setExample}
                    onSubmitPrompt={(query) => {
                      setSeedQuery(query);
                      setModel(model);
                      setPersona(persona);
                    }}
                  />
                </div>
              }
            />
            <Route
              path="/graph/:graphId"
              element={
                <div className="text-white bg-zinc-700 h-screen w-screen fixed left-0 top-0">
                  <GraphPage
                    userId={userId}
                    apiKey={apiKey}
                    seedQuery={seedQuery}
                    persona={persona}
                    model={model}
                    onExit={() => {}}
                  />
                </div>
              }
            />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
