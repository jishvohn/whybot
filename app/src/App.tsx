import { Fragment, useState } from "react";
import { FlowProvider } from "./Flow";
import "./index.css";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { Listbox, Transition } from "@headlessui/react";

function StartPage(props: { onSubmitQuery: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const availableModels = [
    { name: "GPT-4", value: "gpt4" },
    { name: "GPT-3.5", value: "gpt3.5" },
  ];
  const [selectedModel, setSelectedModel] = useState<{
    name: string;
    value: string;
  }>(availableModels[0]);
  return (
    <div className="w-72 mx-auto flex flex-col mt-4">
      <Listbox value={selectedModel} onChange={setSelectedModel}>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
              Model
            </Listbox.Label>
            <div className="relative mt-2">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <span className="block truncate">{selectedModel.name}</span>
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {availableModels.map((model) => (
                    <Listbox.Option
                      key={model.value}
                      className={({ active }) =>
                        classNames(
                          active ? "bg-indigo-600 text-white" : "text-gray-900",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={model}
                    >
                      {({ selected, active }) => (
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
                                active ? "text-white" : "text-indigo-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
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
          </>
        )}
      </Listbox>
      <div className="mt-24 mb-4">What would you like to understand?</div>
      <div className="flex space-x-2 items-center mb-4">
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
