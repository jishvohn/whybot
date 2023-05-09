import { Fragment, useMemo, useState, Dispatch, SetStateAction } from "react";
import { openai } from "./Flow";
import "./index.css";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { Listbox, Transition, Dialog } from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";
import GraphPage from "./GraphPage";
import { Configuration, OpenAIApi } from "openai";

const AVAILABLE_MODELS = [
  { name: "GPT-3.5", value: "gpt3.5" },
  { name: "GPT-4", value: "gpt4" },
];

const AVAILABLE_PERSONAS = [
  { name: "Researcher", value: "researcher" },
  { name: "Auto", value: "auto" },
  { name: "Toddler", value: "toddler" },
  { name: "Nihilistic Toddler", value: "nihilistic-toddler" },
  { name: "Wise", value: "wise" },
];

type APIKeyModalProps = {
  open: boolean;
  onClose: () => void;
  apiKeyState: string;
  setApiKeyState: Dispatch<SetStateAction<string>>;
};

enum apiErrorState {
  Error = "error",
  Initial = "initial",
  Success = "success",
}

export function APIKeyModal({
  open,
  onClose,
  apiKeyState,
  setApiKeyState,
}: APIKeyModalProps) {
  const [growingKey, setGrowingKey] = useState("");
  const [apiError, setApiError] = useState<string>(apiErrorState.Initial);

  const validate = useMemo(async () => {
    if (growingKey.length === 0) {
      setApiError(apiErrorState.Initial);
      return;
    }
    // prelim validation
    if (growingKey.startsWith("sk-") && growingKey.length === 51) {
      const config = new Configuration({ apiKey: growingKey });
      const openai = new OpenAIApi(config);
      try {
        const response = await openai.listModels();
        setApiError(apiErrorState.Success);
        console.log("response", response);
        return;
      } catch (error: any) {
        console.error(error);
        console.log(error);
        setApiError(apiErrorState.Error);
      }
    }
    setApiError(apiErrorState.Error);
  }, [growingKey]);

  const borderClass = useMemo(() => {
    switch (apiError) {
      case apiErrorState.Initial:
        return "border border-gray-400/70 focus:border-gray-400";
      case apiErrorState.Error:
        return "border border-red-400/70 focus:border-red-400";
    }
  }, [apiError]);

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-700 px-4 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-100">API key</p>
                  </div>
                </div>
                <TextareaAutosize
                  autoFocus
                  className={`sm:mt-4 px-2 py-1 bg-transparent ${borderClass} text-sm text-white rounded-md outline-none grow`}
                  value={growingKey}
                  onChange={(e) => {
                    setGrowingKey(e.target.value);
                  }}
                />
                {apiError === apiErrorState.Error && (
                  <div className="mt-1 text-xs text-red-400">
                    Invalid API key
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

// all right what am I doing
// so i need to have an input where people can enter their API key
// we need to ping openai with this api key to test if it works
// and then we need to use this API key to actually make requests.
// I also need to create a separate openai call that doesn't go to the server
// it instead makes it from the client in a streaming fashion
// ok we can do that
// so what's the structure of the components here
// App renders GraphPage -- we need to pass in props.apiKey to GraphPage
// and then use an openai function with that api key to make a streaming call
// actually that's the highest priority stuff so let me do that first

type APIInfoModalProps = {
  open: boolean;
  onClose: () => void;
  apiKeyState: string;
  setApiKeyState: Dispatch<SetStateAction<string>>;
};
export function APIInfoModal({
  open,
  onClose,
  apiKeyState,
  setApiKeyState,
}: APIInfoModalProps) {
  const [isAPIKeyModalOpen, setAPIKeyModalOpen] = useState(false);
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
                        setAPIKeyModalOpen(true);
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
      <APIKeyModal
        open={isAPIKeyModalOpen}
        onClose={() => {
          setAPIKeyModalOpen(false);
        }}
        setApiKeyState={setApiKeyState}
        apiKeyState={apiKeyState}
      />
    </>
  );
}

function StartPage(props: {
  onSubmitQuery: (query: string, model: string, persona: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<{
    name: string;
    value: string;
  }>(AVAILABLE_MODELS[0]);
  const [selectedPersona, setSelectedPersona] = useState<{
    name: string;
    value: string;
  }>(AVAILABLE_PERSONAS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  console.log("apiKey", apiKey);
  const gptClient = useMemo(() => {
    const configuration = new Configuration({ apiKey });
    return new OpenAIApi(configuration);
  }, [apiKey]);

  return (
    <div className="w-[450px] mx-auto flex flex-col mt-8">
      <div className="flex space-x-2">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-4">
            <Listbox value={selectedModel} onChange={setSelectedModel}>
              {({ open }) => (
                <div className="flex items-center space-x-5">
                  <Listbox.Label className="block text-sm leading-6">
                    Model:
                  </Listbox.Label>
                  <div className="relative w-28">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left shadow-sm sm:text-sm sm:leading-6 border border-white/30 hover:border-white/40">
                      <span className="block truncate">
                        {selectedModel.name}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-700 border border-white/30 py-1 shadow-lg sm:text-sm">
                        {AVAILABLE_MODELS.map((model) => (
                          <Listbox.Option
                            key={model.value}
                            className={({ active }) =>
                              classNames(
                                "relative cursor-pointer select-none py-2 pl-3 pr-9",
                                { "bg-zinc-600": active }
                              )
                            }
                            value={model}
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate"
                                  )}
                                >
                                  {model.name}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      "absolute inset-y-0 right-0 flex items-center pr-2"
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </div>
              )}
            </Listbox>
            <div
              className="flex space-x-1 cursor-pointer opacity-80 hover:opacity-90"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              <div className="border-b border-dashed border-gray-300 text-sm text-gray-300">
                3 prompts left
              </div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <APIInfoModal
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
            }}
            setApiKeyState={setApiKey}
            apiKeyState={apiKey}
          />
          <Listbox value={selectedPersona} onChange={setSelectedPersona}>
            {({ open }) => (
              <div className="flex items-center space-x-2">
                <Listbox.Label className="block text-sm leading-6">
                  Persona:
                </Listbox.Label>
                <div className="relative w-48">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left shadow-sm sm:text-sm sm:leading-6 border border-white/30 hover:border-white/40">
                    <span className="block truncate">
                      {selectedPersona.name}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-700 border border-white/30 py-1 shadow-lg sm:text-sm">
                      {AVAILABLE_PERSONAS.map((model) => (
                        <Listbox.Option
                          key={model.value}
                          className={({ active }) =>
                            classNames(
                              "relative cursor-pointer select-none py-2 pl-3 pr-9",
                              { "bg-zinc-600": active }
                            )
                          }
                          value={model}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {model.name}
                              </span>

                              {selected ? (
                                <span
                                  className={classNames(
                                    "absolute inset-y-0 right-0 flex items-center pr-2"
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </div>
            )}
          </Listbox>
        </div>
      </div>
      <div className="mt-24 mb-4">What would you like to understand?</div>
      <div className="flex space-x-2 items-center mb-4">
        <TextareaAutosize
          autoFocus
          className="w-80 text-xl outline-none bg-transparent border-b border-white/40 focus:border-white overflow-hidden grow"
          placeholder="Why is the meaning of life 42?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              props.onSubmitQuery(
                query,
                selectedModel.value,
                selectedPersona.value
              );
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
              props.onSubmitQuery(
                query,
                selectedModel.value,
                selectedPersona.value
              );
            }
          }}
        />
      </div>
      <div className="flex space-x-4 items-center cursor-pointer group">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3004/3004157.png"
          className="w-6 h-6 invert opacity-70 group-hover:opacity-80"
        />
        <div
          className="text-sm opacity-70 group-hover:opacity-80"
          onClick={() => {
            setQuery("");
            openai(
              "Write a random but interesting 'why' question.",
              1,
              (chunk) => {
                setQuery((old) => (old + chunk).trim());
              }
            );
          }}
        >
          Suggest random question
        </div>
      </div>
    </div>
  );
}

function App() {
  const [seedQuery, setSeedQuery] = useState<string>();
  const [model, setModel] = useState("gpt4");
  const [persona, setPersona] = useState("researcher");

  return (
    <div className="text-white bg-zinc-700 min-h-screen flex flex-col">
      {seedQuery ? (
        <GraphPage seedQuery={seedQuery} persona={persona} model={model} />
      ) : (
        <div>
          {/*<FlowProvider/>*/}
          <StartPage
            onSubmitQuery={(query, model, persona) => {
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
