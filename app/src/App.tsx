import { useState } from "react";
import "./index.css";
import GraphPage from "./GraphPage";
import { PERSONAS } from "./personas";
import { GraphPageExample } from "./GraphPageExample";
import { MODELS } from "./models";
import { ApiKey } from "./APIKeyModal";
import { getApiKeyFromLocalStorage } from "./APIKeyModal";
import StartPage, { Example } from "./StartPage";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AboutPage from "./AboutPage";

function CoreStuff() {
  const [seedQuery, setSeedQuery] = useState<string>();
  const [model, setModel] = useState(Object.keys(MODELS)[0]);
  const [persona, setPersona] = useState(Object.keys(PERSONAS)[0]);
  const [apiKey, setApiKey] = useState<ApiKey>(getApiKeyFromLocalStorage());
  const [example, setExample] = useState<Example>();

  return (
    <div className="text-white bg-zinc-700 min-h-screen flex flex-col fs-unmask">
      {example ? (
        <GraphPageExample
          example={example}
          onExit={() => {
            setSeedQuery("");
            setExample(undefined);
          }}
        />
      ) : seedQuery ? (
        <GraphPage
          apiKey={apiKey}
          onExit={() => setSeedQuery("")}
          seedQuery={seedQuery}
          persona={persona}
          model={model}
        />
      ) : (
        <div>
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
      )}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <CoreStuff />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
