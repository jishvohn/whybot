import { useState, Dispatch, SetStateAction } from "react";
import { openai } from "./Flow";
import "./index.css";
import {
  PaperAirplaneIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import TextareaAutosize from "react-textarea-autosize";
import { QATree } from "./GraphPage";
import { PERSONAS } from "./personas";
import { useQuery } from "@tanstack/react-query";
import { getFingerprint } from "./main";
import { SERVER_HOST } from "./constants";
import { MODELS } from "./models";
import Dropdown from "./Dropdown";
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import { APIInfoModal, APIKeyModal, ApiKey } from "./APIKeyModal";
import { Link } from "react-router-dom";

export type Example = {
  persona: string;
  model: string;
  tree: QATree;
};

function StartPage(props: {
  model: string;
  persona: string;
  apiKey: ApiKey;
  onSubmitPrompt: (prompt: string) => void;
  onSetModel: (model: string) => void;
  onSetPersona: (persona: string) => void;
  onSetExample: (example: Example) => void;
  setApiKey: Dispatch<SetStateAction<ApiKey>>;
}) {
  const [query, setQuery] = useState("");
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const promptsRemainingQuery = useQuery({
    queryKey: ["promptsRemaining"],
    queryFn: async () => {
      const result = await fetch(
        `${SERVER_HOST}/api/prompts-remaining?fp=${await getFingerprint()}`
      );
      return result.json();
    },
  });
  const promptsRemaining =
    promptsRemainingQuery.isLoading || promptsRemainingQuery.error
      ? 3
      : promptsRemainingQuery.data.remaining;
  const disableEverything = promptsRemaining === 0 && !props.apiKey.valid;

  const examplesQuery = useQuery({
    queryKey: ["examples"],
    queryFn: async () => {
      const result = await fetch(`${SERVER_HOST}/api/examples`);
      return result.json();
    },
  });
  const examples: Example[] = examplesQuery.isLoading ? [] : examplesQuery.data;

  console.log("examplesQuery", examplesQuery.data);

  async function submitPrompt() {
    props.onSubmitPrompt(query);
    if (!props.apiKey.valid) {
      fetch(`${SERVER_HOST}/api/use-prompt?fp=${await getFingerprint()}`);
    }
  }

  const [randomQuestionLoading, setRandomQuestionLoading] = useState(false);

  return (
    <>
      <div className="m-4">
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Dropdown
              className="w-44"
              value={props.persona}
              options={Object.entries(PERSONAS).map(([k, v]) => {
                return { value: k, name: v.name, popup: v.description };
              })}
              onChange={props.onSetPersona}
            />
            <Dropdown
              className="w-28"
              value={props.model}
              options={Object.entries(MODELS).map(([k, v]) => {
                return { value: k, name: v.name };
              })}
              onChange={props.onSetModel}
            />
            {props.apiKey.valid ? (
              <div
                className="flex space-x-1 cursor-pointer opacity-80 hover:opacity-90"
                onClick={() => {
                  setIsApiKeyModalOpen(true);
                }}
              >
                <div className="border-b border-dashed border-gray-300 text-sm text-gray-300">
                  Using personal API key
                </div>
                <InformationCircleIcon className="h-5 w-5 text-gray-400" />
              </div>
            ) : (
              <div
                className="flex items-center space-x-1 cursor-pointer opacity-80 hover:text-gray-100"
                onClick={() => {
                  setIsInfoModalOpen(true);
                }}
              >
                <div
                  className={classNames(
                    "border-b border-dashed border-gray-300 text-sm text-gray-300 shrink-0",
                    {
                      "text-white rounded px-2 py-1 border-none bg-red-700 hover:bg-red-800":
                        disableEverything,
                    }
                  )}
                >
                  {promptsRemaining} prompt{promptsRemaining === 1 ? "" : "s"}{" "}
                  left{disableEverything && "—use own API key?"}
                </div>
                {!disableEverything && (
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            )}
          </div>
          <Link
            className="text-sm text-white/70 mt-1 hover:text-white/80"
            to="/about"
          >
            About
          </Link>
        </div>
        <APIInfoModal
          open={isInfoModalOpen}
          onClose={() => {
            setIsInfoModalOpen(false);
          }}
          setApiKeyModalOpen={() => {
            setIsApiKeyModalOpen(true);
          }}
        />
        <APIKeyModal
          open={isApiKeyModalOpen}
          onClose={() => {
            setIsApiKeyModalOpen(false);
          }}
          apiKey={props.apiKey}
          setApiKey={props.setApiKey}
        />
      </div>
      <div className="w-[450px] max-w-full mx-auto flex flex-col mt-40 px-4">
        <div
          className={classNames({
            "opacity-30 cursor-not-allowed": disableEverything,
          })}
        >
          <div
            className={classNames({
              "pointer-events-none": disableEverything,
            })}
          >
            <div className="mb-4">What would you like to understand?</div>
            <div className="flex space-x-2 items-center mb-4">
              <TextareaAutosize
                disabled={disableEverything}
                className="w-[400px] text-2xl outline-none bg-transparent border-b border-white/40 focus:border-white overflow-hidden shrink"
                placeholder="Why is the meaning of life 42?"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitPrompt();
                  }
                }}
              />
              <PaperAirplaneIcon
                className={classNames("w-5 h-5 shrink-0", {
                  "opacity-30": !query,
                  "cursor-pointer": query,
                })}
                onClick={async () => {
                  if (query) {
                    submitPrompt();
                  }
                }}
              />
            </div>
            <div className={"flex space-x-4 items-center cursor-pointer group"}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/3004/3004157.png"
                className={classNames(
                  "w-6 h-6 invert opacity-70 group-hover:opacity-80",
                  { "animate-pulse": randomQuestionLoading }
                )}
              />
              <div
                className={"text-sm opacity-70 group-hover:opacity-80"}
                onClick={async () => {
                  setQuery("");
                  setRandomQuestionLoading(true);
                  await openai(
                    PERSONAS[props.persona].promptForRandomQuestion,
                    {
                      model: MODELS[props.model].key,
                      apiKey: props.apiKey.key,
                      temperature: 1,
                      onChunk: (chunk) => {
                        setQuery((old) => (old + chunk).trim());
                      },
                    }
                  );
                  setRandomQuestionLoading(false);
                }}
              >
                Suggest random question
              </div>
            </div>
          </div>
        </div>
        <div className="mt-32 text-gray-300 mb-16">
          <div className="mb-4">Play example runs</div>
          {examples
            .filter((ex) => ex.persona === props.persona)
            .map((example, i) => {
              return (
                <div
                  key={i}
                  className="mb-4 flex items-center space-x-2 text-white/50 hover:border-gray-300 hover:text-gray-300 cursor-pointer"
                  onClick={() => {
                    props.onSetExample(example);
                  }}
                >
                  <PlayCircleIcon className="w-5 h-5 shrink-0" />
                  <div>{example.tree["0"].question}</div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default StartPage;
