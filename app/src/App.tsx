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
} from "./util/indexedDB";
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
  const [userId, setUserId] = useState<string>(
    getUserIdOrCreateFromLocalStorage()
  );

  // ok now I have the userId
  // now when the user hits enter, I want it to render the GraphPage component with apiKey,
  // seedQuery, persona and model. How do I do that?
  // wait a second. I can just have it render CoreStuff like usual right?
  // I guess what would the proper way be?
  // For routing, I want to render a component based on the state of another component.

  // when the user starts generating, aka seedQuery is set we need to render GraphPage under the /graph/{id} route.
  // so we change the history, and this component is going to render again
  // so we need to render this parent component

  // I think if I get rid of the createBrowserRouter
  // and manually wrap the Router component around App.
  // And then do the Route wrappers for each path
  // I think we should be good.

  // ok I confirmed that if you navigate to a route from a sub-component, the parent component's state
  // will not get reset. Only that child component will render but with the parent's original state.
  // ok gang.

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
              path="/graph/:graph_id"
              element={
                <div className="text-white bg-zinc-700 h-screen w-screen fixed left-0 top-0">
                  <GraphPage
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
