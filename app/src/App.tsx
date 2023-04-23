import { Fragment, useState } from "react";
import { FlowProvider, openai } from "./Flow";
import "./index.css";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { Listbox, Transition } from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";

let questionQueue: string[];
let resultTree: {
  [key: string]: { question: string; parent?: string; answer: string };
};

async function generateAnswers(initialQuestion: string) {
  questionQueue = ["0"];
  resultTree = {
    "0": {
      question: initialQuestion,
      answer: "",
    },
  };

  let l = 0;
  while (questionQueue.length > 0) {
    l += 1;
    if (l > 4) {
      break;
    }
    const nodeId = questionQueue.shift();
    if (nodeId) {
      await openai(resultTree[nodeId].question, 1, (chunk) => {
        resultTree[nodeId].answer += chunk;
      });

      console.log("RESULT TREE", resultTree);

      const newPrompt = `You are a curious researcher that tries to uncover fundamental truths about a given "why" by repeatedly asking follow-up "why" questions. Here is the question you seek to answer: ${resultTree[nodeId].question}?

      You've already done some research on the topic, and have surfaced the following information:
      
      ${resultTree[nodeId].answer}
      
      Write 1-3 interesting "why" follow-up questions on that information. For each follow-up question, provide a numeric score from 1 to 10 rating how interesting the question may be to the asker of the original question. Format your answer as a JSON array like this:
      
      [{"question": "...", "score": 4}, ...]`;

      let questionsJson = "";
      await openai(newPrompt, 1, (chunk) => {
        questionsJson += chunk;
      });

      const questions = JSON.parse(questionsJson);
      questions.forEach((question: { question: string; score: number }) => {
        const id = Math.random().toString(36).substring(2, 9);
        resultTree[id] = {
          question: question.question,
          parent: nodeId,
          answer: "",
        };
        questionQueue.push(id);
      });
      console.log("QUESTIONS", questions);
      console.log("RESULT TREE 2", resultTree);
    }
  }
}

generateAnswers("Why is the sky blue?");

const AVAILABLE_MODELS = [
  { name: "GPT-4", value: "gpt4" },
  { name: "GPT-3.5", value: "gpt3.5" },
];

function StartPage(props: {
  onSubmitQuery: (query: string, model: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<{
    name: string;
    value: string;
  }>(AVAILABLE_MODELS[0]);

  return (
    <div className="w-72 mx-auto flex flex-col mt-8">
      <Listbox value={selectedModel} onChange={setSelectedModel}>
        {({ open }) => (
          <div className="flex items-center space-x-2">
            <Listbox.Label className="block text-sm leading-6">
              Model:
            </Listbox.Label>
            <div className="relative w-36">
              <Listbox.Button className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left shadow-sm sm:text-sm sm:leading-6 border border-white/30 hover:border-white/40">
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
          </div>
        )}
      </Listbox>
      <div className="mt-24 mb-4">What would you like to understand?</div>
      <div className="flex space-x-2 items-center mb-4">
        <TextareaAutosize
          autoFocus
          className="w-80 text-xl outline-none bg-transparent border-b border-white/40 focus:border-white overflow-hidden"
          placeholder="Why is the meaning of life 42?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              props.onSubmitQuery(query, selectedModel.value);
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
              props.onSubmitQuery(query, selectedModel.value);
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
            openai(
              "Write a random but interesting 'why' question.",
              1,
              (answer) => {
                setQuery(answer);
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
  const [running, setRunning] = useState(false);
  const [model, setModel] = useState("gpt4");

  return (
    <div className="text-white bg-zinc-700 min-h-screen flex flex-col">
      {seedQuery ? (
        <FlowProvider userQuery={seedQuery} />
      ) : (
        <StartPage
          onSubmitQuery={(query, model) => {
            setSeedQuery(query);
            setModel(model);
          }}
        />
      )}
    </div>
  );
}

export default App;
