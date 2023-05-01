import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { MarkerType, Node, Edge } from "reactflow";

type Memory = {
  question: string;
  answer: string;
};
function getPromptForAnswer(
  persona: string,
  currentQuestion: string,
  memory?: Memory
) {
  if (memory) {
    return `You were previously asked this question: ${memory.question}
          You responded with this answer: ${memory.answer}
          Given that context, ${
            persona === "researcher" || persona === "auto"
              ? `please provide an answer to this follow up question: ${currentQuestion}`
              : persona === "toddler"
              ? `please provide a casual answer to this follow up question, like you're chatting. 
              Include emojis that are relevant to your answer: ${currentQuestion}`
              : persona === "nihilistic-toddler"
              ? `please answer this question in a nihilistic, pessimistic way but keep it relevant 
              to the subject matter. Act as if you're chatting. Include emojis if they are relevant 
              to your answer: ${currentQuestion}`
              : `please answer this follow up question in 2 sentences or less, like the wise old man 
              from movies: ${currentQuestion}`
          }`;
  }
  return `${
    persona === "toddler"
      ? "Please provide a casual and short answer to this question: "
      : persona === "wise"
      ? "Please answer this question in 2 sentences or less: "
      : ""
  }${currentQuestion}`;
}

function generateAnswers(
  model: string,
  persona: string,
  resultTreeRef: React.MutableRefObject<QATree>,
  onChangeResultTree: (newTree: any) => void
) {
  console.log(model);
  let stoppedRef = { current: false };

  (async () => {
    const questionQueue: string[] = ["0"];
    const resultTree: QATree = resultTreeRef.current;

    let l = 0;
    while (questionQueue.length > 0) {
      if (stoppedRef.current) {
        return;
      }

      // TODO: Setting to 5 for debugging
      l += 1;
      if (l > 5) {
        break;
      }
      const nodeId = questionQueue.shift();
      if (nodeId && nodeId in resultTree) {
        const node = resultTree[nodeId];
        const parent = resultTree[node.parent ?? ""];
        let memory = undefined;
        if (parent) {
          memory = {
            question: parent.question,
            answer: parent.answer,
          };
        }
        const prompt = getPromptForAnswer(persona, node.question, memory);

        await openai(prompt, 1, (chunk) => {
          if (stoppedRef.current || !(nodeId in resultTree)) {
            return;
          }
          resultTree[nodeId].answer += chunk;
          onChangeResultTree(resultTree);
        });
        if (stoppedRef.current) {
          return;
        }

        console.log("RESULT TREE", resultTree);

        let questions: { question: string; score: number }[];

        if (persona === "researcher") {
          const newPrompt = `You are a curious researcher that tries to uncover fundamental truths about a given "why" by repeatedly asking follow-up "why" questions. Here is the question you seek to answer: ${node.question}?
          You've already done some research on the topic, and have surfaced the following information:
          ---
          ${node.answer}
          ---
          Write 1-2 interesting "why" follow-up questions on that information. For each follow-up question, provide a numeric score from 1 to 10 rating how interesting the question may be to the asker of the original question. Format your answer as a JSON array like this: [{"question": "...", "score": 1}, {"question": "...", "score": 2}, ...]
          For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10}]
          Your answer: `;

          let questionsJson = "";
          await openai(newPrompt, 1, (chunk) => {
            questionsJson += chunk;
          });
          if (stoppedRef.current) {
            return;
          }

          try {
            questions = JSON.parse(questionsJson);
          } catch (e) {
            console.log("Not proper JSON:", questionsJson);
            console.error("Error parsing JSON", e);
            continue;
          }
        } else if (persona === "auto") {
          const newPrompt = `Given a question/answer pair, generate a likely persona who asked 
          that question. And then pretend you are that persona and write the most interesting 1-2 follow-up questions that this persona would enjoy learning about the most.  For each follow-up question, provide the persona summary & a numeric score from 1 to 10 rating how interesting the question may be to your persona. Format your answer as a JSON array like this: [{"question": "...", "score": 1, "persona_summary": "..."}, {"question": "...", "score": 2, "persona_summary": "..."}, ...]
          
          Your number 1 priority is to generate the most interesting questions that help your generated persona the most.
          
          Question: ${node.question}
          Information/Answer to the question: ${node.answer}
          
          For example, if you think the question "Why is the sky blue?" is interesting, you would write: [{"question": "Why is the sky blue?", "score": 10, "persona_summary": "Young man thinking about the scientific nature of the universe and our planet"}]
          Your answer: 
        `;
          let questionsJson = "";
          await openai(newPrompt, 1, (chunk) => {
            questionsJson += chunk;
          });
          if (stoppedRef.current) {
            return;
          }

          try {
            questions = JSON.parse(questionsJson);
            console.log(questions[0].persona_summary);
          } catch (e) {
            console.log("Not proper JSON:", questionsJson);
            console.error("Error parsing JSON", e);
            continue;
          }
        } else if (persona === "toddler" || persona === "nihilistic-toddler") {
          questions = [{ question: "Why?", score: 10 }];
        } else {
          questions = [{ question: "Tell me why; go deeper.", score: 10 }];
        }

        questions.forEach((question: { question: string; score: number }) => {
          if (stoppedRef.current || !(nodeId in resultTree)) {
            return;
          }
          const id = Math.random().toString(36).substring(2, 9);
          resultTree[id] = {
            question: question.question,
            parent: nodeId,
            answer: "",
          };

          // Here is where we're setting the parent (backwards edge)
          // which means we can set the children (forward edge)
          if (resultTree[nodeId].children == null) {
            resultTree[nodeId].children = [id];
          } else {
            resultTree[nodeId].children?.push(id);
          }

          onChangeResultTree(resultTree);
          questionQueue.push(id);
        });
        console.log("QUESTIONS", questions);
        console.log("RESULT TREE 2", resultTree);
      }
    }
  })();

  return () => {
    stoppedRef.current = true;
  };
}

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
  return (
    <div className="w-[450px] mx-auto flex flex-col mt-8">
      <div className="flex space-x-6">
        <Listbox value={selectedModel} onChange={setSelectedModel}>
          {({ open }) => (
            <div className="flex items-center space-x-2">
              <Listbox.Label className="block text-sm leading-6">
                Model:
              </Listbox.Label>
              <div className="relative w-28">
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
        <Listbox value={selectedPersona} onChange={setSelectedPersona}>
          {({ open }) => (
            <div className="flex items-center space-x-2">
              <Listbox.Label className="block text-sm leading-6">
                Persona:
              </Listbox.Label>
              <div className="relative w-48">
                <Listbox.Button className="relative w-full cursor-pointer rounded-md py-1.5 pl-3 pr-10 text-left shadow-sm sm:text-sm sm:leading-6 border border-white/30 hover:border-white/40">
                  <span className="block truncate">{selectedPersona.name}</span>
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

type QATree = {
  [key: string]: {
    question: string;
    parent?: string;
    answer: string;
    children?: string[];
  };
};

export type NodeDims = {
  [key: string]: {
    width: number;
    height: number;
  };
};

export type TreeNode = Node & {
  parentNodeID: string;
};

export const convertTreeToFlow = (
  tree: QATree,
  setNodeDims: any,
  deleteBranch: any
): any => {
  const nodes: TreeNode[] = [];
  Object.keys(tree).forEach((key) => {
    nodes.push({
      id: `q-${key}`,
      type: "fadeText",
      data: {
        text: tree[key].question,
        nodeID: `q-${key}`,
        setNodeDims,
        question: true,
      },
      position: { x: 0, y: 0 },
      parentNodeID: tree[key].parent != null ? `a-${tree[key].parent}` : "",
    });
    nodes.push({
      id: `a-${key}`,
      type: "fadeText",
      data: {
        text: tree[key].answer,
        nodeID: `a-${key}`,
        setNodeDims,
        question: false,
      },
      position: { x: 0, y: 0 },
      parentNodeID: `q-${key}`,
    });
  });
  const edges: Edge[] = [];
  nodes.forEach((n) => {
    if (n.parentNodeID != "") {
      edges.push({
        id: `${n.parentNodeID}-${n.id}`,
        type: "deleteEdge",
        source: n.parentNodeID,
        target: n.id,
        data: {
          deleteBranch,
        },
        animated: true,
        markerEnd: { type: MarkerType.Arrow },
      });
    }
  });

  return { nodes, edges };
};

function FlowGraph(props: {
  seedQuery: string;
  model: string;
  persona: string;
}) {
  const [resultTree, setResultTree] = useState<QATree>({});
  const resultTreeRef = useRef<QATree>({
    "0": {
      question: props.seedQuery,
      answer: "",
    },
  });

  useEffect(() => {
    const stop = generateAnswers(
      props.model,
      props.persona,
      resultTreeRef,
      (resultTree) => {
        setResultTree(JSON.parse(JSON.stringify(resultTree)));
      }
    );

    return () => {
      stop();
    };
  }, []);

  const [nodeDims, setNodeDims] = useState<NodeDims>({});

  const deleteBranch = useCallback(
    (id: string) => {
      const qaNode = resultTree[id];
      console.log("deleting qaNode, question", qaNode.question);

      if (id in resultTreeRef.current) {
        delete resultTreeRef.current[id];
        setResultTree({ ...resultTreeRef.current });
      }

      const children = "children" in qaNode ? qaNode.children ?? [] : [];
      for (var child of children) {
        deleteBranch(child);
      }
    },
    [resultTree, setResultTree]
  );

  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, deleteBranch);
  }, [resultTree]);

  return (
    <div className="text-sm">
      <FlowProvider
        flowNodes={nodes}
        flowEdges={edges}
        nodeDims={nodeDims}
        deleteBranch={deleteBranch}
      />
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
        <FlowGraph seedQuery={seedQuery} persona={persona} model={model} />
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
