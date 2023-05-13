import {
  Fragment,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
import { openai, openai_browser } from "./Flow";
import "./index.css";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { Listbox, Transition, Dialog } from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";
import GraphPage, { QATree } from "./GraphPage";
import { PERSONAS } from "./personas";
import { useQuery } from "@tanstack/react-query";
import { getFingerprint } from "./main";
import { SERVER_HOST } from "./constants";
import { GraphPageExample } from "./GraphPageExample";
import { MODELS } from "./models";
import Dropdown from "./Dropdown";
import { PlayCircleIcon } from "@heroicons/react/24/outline";

export function clearApiKeyLocalStorage() {
  localStorage.removeItem("apkls");
}

// base64 encode api key and set in localStorage
export function setApiKeyInLocalStorage(apiKey: string) {
  const encodedApiKey = btoa(apiKey);
  localStorage.setItem("apkls", encodedApiKey);
  console.log("set em");
}

// pull from localStorage and base64 decode
export function getApiKeyFromLocalStorage() {
  const encodedApiKey = localStorage.getItem("apkls");
  if (encodedApiKey != null) {
    console.log("got em");
    return { key: atob(encodedApiKey), valid: true };
  }
  return { key: "", valid: false };
}

type APIKeyModalProps = {
  open: boolean;
  onClose: () => void;
  apiKey: ApiKey;
  setApiKey: Dispatch<SetStateAction<ApiKey>>;
};

enum KeyStatus {
  Error = "error",
  Initial = "initial",
  Success = "success",
}

export function APIKeyModal({
  open,
  onClose,
  apiKey,
  setApiKey,
}: APIKeyModalProps) {
  const initialStatus = apiKey.valid ? KeyStatus.Success : KeyStatus.Initial;
  const [status, setStatus] = useState<string>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const validate = useCallback(
    async (key: string) => {
      setErrorMessage("");
      // preliminary validation
      let valid = false;
      if (key.length === 0) {
        setStatus(KeyStatus.Initial);
      } else if (!key.startsWith("sk-") || key.length !== 51) {
        setStatus(KeyStatus.Error);
      } else {
        // actual validation by pinging OpenAI's API
        try {
          await openai_browser("2+2=", {
            apiKey: key,
            temperature: 1,
            model: "gpt-3.5-turbo",
            onChunk: () => {
              setStatus(KeyStatus.Success);
              valid = true;
              setApiKeyInLocalStorage(key);
            },
          });
        } catch (error: any) {
          console.error(error);
          setErrorMessage(error);
          setStatus(KeyStatus.Error);
        }
      }
      setApiKey({ key, valid });
    },
    [apiKey]
  );

  // Error styling
  const errorStyling = useMemo(() => {
    switch (status) {
      case KeyStatus.Error:
        return "border border-red-400/70 focus:border-red-400";
      case KeyStatus.Success:
        return "border border-green-400/70";
      default:
        return "border border-gray-400/70 focus:border-gray-400";
    }
  }, [status]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative max-w-[450px] transform overflow-hidden rounded-lg bg-gray-700 px-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                <div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-100">API key</p>
                  </div>
                </div>
                <input
                  type="password"
                  spellCheck={false}
                  autoFocus
                  className={`sm:mt-4 w-full px-2 py-1 bg-transparent ${errorStyling} text-xs text-white rounded-md outline-none grow`}
                  value={apiKey.key}
                  onChange={async (e) => {
                    // If the key was originally valid, the current edit will be invalid which means we clear localStorage.
                    setApiKey({ key: e.target.value, valid: false });
                    if (status === KeyStatus.Success) {
                      clearApiKeyLocalStorage();
                    }
                    await validate(e.target.value);
                  }}
                />
                {status === KeyStatus.Error && (
                  <>
                    <div className="mt-3 text-xs text-red-400 flex items-center space-x-[2px]">
                      <div>
                        <XMarkIcon className="w-4 h-4 stroke-red" />
                      </div>
                      <div>Invalid API key</div>
                    </div>
                    {errorMessage != "" && (
                      <div className="mt-1 text-xs text-red-400">
                        {errorMessage}
                      </div>
                    )}
                  </>
                )}
                {status === KeyStatus.Success && (
                  <div className="mt-3 text-xs text-green-400 flex items-center space-x-[2px]">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3 stroke-green"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div>Valid API key</div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  Your API key is sent directly to OpenAI from your browser; it
                  never touches our servers!
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type APIInfoModalProps = {
  open: boolean;
  onClose: () => void;
  setApiKeyModalOpen: () => void;
};
export function APIInfoModal({
  open,
  onClose,
  setApiKeyModalOpen,
}: APIInfoModalProps) {
  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-700 px-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-100">
                        Running these prompts is expensive, so for now we’re
                        limiting everyone to 3 a day. However, you can bypass
                        the limit if you have your own OpenAI API key!
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex outline-none rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => {
                        setApiKeyModalOpen();
                        onClose();
                      }}
                    >
                      Use my own API key
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

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
        <div className="flex items-center space-x-4 flex-wrap">
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
              className="flex space-x-1 cursor-pointer opacity-80 hover:text-gray-100"
              onClick={() => {
                setIsInfoModalOpen(true);
              }}
            >
              <div
                className={classNames(
                  "border-b border-dashed border-gray-300 text-sm text-gray-300 shrink-0",
                  { "text-red-500 border-red-500": disableEverything }
                )}
              >
                {promptsRemaining} prompt{promptsRemaining === 1 ? "" : "s"}{" "}
                left
              </div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
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
            "opacity-50 pointer-events-none": disableEverything,
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
                await openai(PERSONAS[props.persona].promptForRandomQuestion, {
                  model: MODELS[props.model].key,
                  apiKey: props.apiKey.key,
                  temperature: 1,
                  onChunk: (chunk) => {
                    setQuery((old) => (old + chunk).trim());
                  },
                });
                setRandomQuestionLoading(false);
              }}
            >
              Suggest random question
            </div>
          </div>
          <div className="mt-32 text-gray-300">
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
      </div>
    </>
  );
}

export type ApiKey = {
  key: string;
  valid: boolean;
};

function App() {
  const [seedQuery, setSeedQuery] = useState<string>();
  const [model, setModel] = useState(Object.keys(MODELS)[0]);
  const [persona, setPersona] = useState(Object.keys(PERSONAS)[0]);
  const [apiKey, setApiKey] = useState<ApiKey>(getApiKeyFromLocalStorage());
  const [example, setExample] = useState<Example>();

  return (
    <div className="text-white bg-zinc-700 min-h-screen flex flex-col">
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

export default App;
