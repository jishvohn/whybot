import { useState } from "react";
import { FlowProvider } from "./Flow";
import "./index.css";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";

function StartPage(props: { onSubmitQuery: (query: string) => void }) {
  const [query, setQuery] = useState("");
  return (
    <div className="w-72 mx-auto mt-32 flex flex-col space-y-4">
      <div>What would you like to understand?</div>
      <div className="flex space-x-2 items-center">
        <input
          autoFocus
          className="underline w-72 text-xl outline-none"
          placeholder="Why is the meaning of life 42?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              props.onSubmitQuery(query);
            }
          }}
        />
        <PaperAirplaneIcon
          className={classNames("w-5 h-5", {
            "opacity-30": !query,
            "cursor-pointer": query,
          })}
          onClick={() => {
            if (query) {
              props.onSubmitQuery(query);
            }
          }}
        />
      </div>
      <div>Suggest random question</div>
    </div>
  );
}

function App() {
  const [seedQuery, setSeedQuery] = useState<string>();
  const [running, setRunning] = useState(false);
  return (
    <>
      {seedQuery ? (
        <FlowProvider />
      ) : (
        <StartPage
          onSubmitQuery={(query) => {
            setSeedQuery(query);
          }}
        />
      )}
    </>
  );
}

export default App;
