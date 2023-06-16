import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowProvider, openai } from "./Flow";
import { Edge, MarkerType, Node } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import { closePartialJson, downloadDataAsJson } from "./util/json";
import { PERSONAS } from "./personas";
import { ApiKey } from "./App";
import { SERVER_HOST, SERVER_HOST_WS } from "./constants";
import { MODELS, Model } from "./models";
import { useParams } from "react-router-dom";
import { getTreeHistory, saveTree, setupDatabase } from "./util/localStorage";
import { IDBPDatabase } from "idb";
import { FocusedContextProvider, isChild } from "./FocusedContext";

export interface QATreeNode {
  question: string;
  parent?: string;
  answer: string;
  children?: string[];
  startedProcessing?: boolean;
}

export interface QATree {
  [key: string]: QATreeNode;
}

export type NodeDims = {
  [key: string]: {
    width: number;
    height: number;
  };
};

type TreeNode = Node & {
  parentNodeID: string;
};

export const convertTreeToFlow = (
  tree: QATree,
  setNodeDims: any,
  deleteBranch: any,
  playing: boolean
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
    if (tree[key].answer) {
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
    }
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
        animated: playing,
        markerEnd: { type: MarkerType.Arrow },
      });
    }
  });

  return { nodes, edges };
};

export interface ScoredQuestion {
  question: string;
  score: number;
}

async function getQuestions(
  apiKey: ApiKey,
  model: string,
  persona: string,
  node: QATreeNode,
  tree: QATree,
  onIntermediate: (partial: ScoredQuestion[]) => void
) {
  const person = PERSONAS[persona];
  if ("getQuestions" in person) {
    onIntermediate(person.getQuestions(node, tree));
    return;
  }
  const promptForQuestions = person.getPromptForQuestions(node, tree);

  let questionsJson = "";
  await openai(promptForQuestions, {
    apiKey: apiKey.key,
    temperature: 1,
    model: MODELS[model].key,
    onChunk: (chunk) => {
      questionsJson += chunk;
      const closedJson = closePartialJson(questionsJson);
      try {
        const parsed = JSON.parse(closedJson);
        onIntermediate(parsed);
      } catch (e) {
        // Ignore these, it will often be invalid
      }
    },
  });

  try {
    // Don't need to actually use the output
    JSON.parse(questionsJson);
  } catch (e) {
    // This is a real error if the final result is not parseable
    console.error(
      "Error parsing JSON:",
      e,
      "The malformed JSON was:",
      questionsJson
    );
  }
}

interface NodeGeneratorOpts {
  apiKey: ApiKey;
  model: string;
  persona: string;
  questionQueue: string[];
  qaTree: QATree;
  focusedId: string | null;
  onChangeQATree: () => void;
  onNodeGenerated: () => Promise<void>;
}

async function* nodeGenerator(
  opts: NodeGeneratorOpts
): AsyncIterableIterator<void> {
  while (true) {
    while (opts.questionQueue.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield;
    }

    console.log("Popped from queue", opts.questionQueue);

    const nodeId = opts.questionQueue.shift();
    if (nodeId == null) {
      throw new Error("Impossible");
    }

    const node = opts.qaTree[nodeId];
    if (node == null) {
      throw new Error(`Node ${nodeId} not found`);
    }
    node.startedProcessing = true;

    const promptForAnswer = PERSONAS[opts.persona].getPromptForAnswer(
      node,
      opts.qaTree
    );

    await openai(promptForAnswer, {
      apiKey: opts.apiKey.key,
      temperature: 1,
      model: MODELS[opts.model].key,
      onChunk: (chunk) => {
        const node = opts.qaTree[nodeId];
        if (node == null) {
          throw new Error(`Node ${nodeId} not found`);
        }
        node.answer += chunk;
        opts.onChangeQATree();
      },
    });

    await opts.onNodeGenerated();
    yield;

    const ids: string[] = [];
    await getQuestions(
      opts.apiKey,
      opts.model,
      opts.persona,
      node,
      opts.qaTree,
      (partial) => {
        if (partial.length > ids.length) {
          for (let i = ids.length; i < partial.length; i++) {
            const newId = Math.random().toString(36).substring(2, 9);
            ids.push(newId);
            opts.qaTree[newId] = {
              question: "",
              parent: nodeId,
              answer: "",
            };

            // Here is where we're setting the parent (backwards edge)
            // which means we can set the children (forward edge)
            if (opts.qaTree[nodeId].children == null) {
              opts.qaTree[nodeId].children = [newId];
            } else {
              opts.qaTree[nodeId].children?.push(newId);
            }
          }
        }
        for (let i = 0; i < partial.length; i++) {
          opts.qaTree[ids[i]].question = partial[i].question;
        }
        opts.onChangeQATree();
      }
    );

    yield;

    ids.forEach((id) => {
      if (
        !opts.qaTree[id].startedProcessing &&
        (!opts.focusedId || isChild(opts.qaTree, opts.focusedId, id))
      ) {
        opts.questionQueue.push(id);
      }
    });
  }
}

class NodeGenerator {
  generator: AsyncIterableIterator<void>;
  playing: boolean;
  ran: boolean;
  destroyed: boolean;
  opts: NodeGeneratorOpts;
  fullyPaused: boolean;
  onFullyPausedChange: (fullyPaused: boolean) => void;

  constructor(
    opts: NodeGeneratorOpts,
    onFullyPausedChange: (fullyPaused: boolean) => void
  ) {
    this.opts = opts;
    this.generator = nodeGenerator(opts);
    this.playing = true;
    this.ran = false;
    this.destroyed = false;
    this.fullyPaused = false;
    this.onFullyPausedChange = onFullyPausedChange;
  }

  setFullyPaused(fullyPaused: boolean) {
    if (this.fullyPaused !== fullyPaused) {
      this.fullyPaused = fullyPaused;
      this.onFullyPausedChange(fullyPaused);
    }
  }

  async run() {
    if (this.ran) {
      throw new Error("Already ran");
    }
    this.ran = true;
    while (true) {
      while (!this.playing) {
        this.setFullyPaused(true);
        if (this.destroyed) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.setFullyPaused(false);
      const { done } = await this.generator.next();
      if (done || this.destroyed) {
        break;
      }
    }
  }

  resume() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  destroy() {
    this.destroyed = true;
    this.opts.onChangeQATree = () => {};
  }
}

class MultiNodeGenerator {
  // Warning: opts gets mutated a lot, which is probably bad practice.
  opts: NodeGeneratorOpts;
  generators: NodeGenerator[];
  onFullyPausedChange: (fullyPaused: boolean) => void;

  constructor(
    n: number,
    opts: NodeGeneratorOpts,
    onFullyPausedChange: (fullyPaused: boolean) => void
  ) {
    this.opts = opts;
    this.generators = [];
    for (let i = 0; i < n; i++) {
      this.generators.push(
        new NodeGenerator(opts, () => {
          this.onFullyPausedChange(
            this.generators.every((gen) => gen.fullyPaused)
          );
        })
      );
    }
    this.onFullyPausedChange = onFullyPausedChange;
  }

  run() {
    for (const gen of this.generators) {
      gen.run();
    }
  }

  resume() {
    for (const gen of this.generators) {
      gen.resume();
    }
  }

  pause() {
    for (const gen of this.generators) {
      gen.pause();
    }
  }

  destroy() {
    for (const gen of this.generators) {
      gen.destroy();
    }
  }

  setFocusedId(id: string | null) {
    this.opts.focusedId = id;
  }
}

const NODE_LIMIT_PER_PLAY = 8;

function GraphPage(props: {
  userId: string;
  seedQuery: string;
  model: string;
  persona: string;
  apiKey: ApiKey;
  onExit(): void;
}) {
  const { graphId } = useParams();
  const [resultTree, setResultTree] = useState<QATree>({});
  const questionQueueRef = useRef<string[]>([]);
  const qaTreeRef = useRef<QATree>({});
  const generatorRef = useRef<MultiNodeGenerator>();
  const [playing, setPlaying] = useState(true);
  const [fullyPaused, setFullyPaused] = useState(false);
  const nodeCountRef = useRef(0);
  const pauseAtNodeCountRef = useRef(NODE_LIMIT_PER_PLAY);
  const idbRef = useRef<IDBDatabase>();
  const [treeID] = useState<string>(uuidv4());

  useEffect(() => {
    const saveGraph = async () => {
      const body = {
        userId: props.userId,
        graphId,
        graph: {
          tree: qaTreeRef.current,
          seedQuery: props.seedQuery,
        },
      };
      try {
        const response = await fetch(`${SERVER_HOST}/api/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`An error occurred: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log(responseData);
      } catch (error) {
        console.error("Error posting the data", error);
      }
    };

    // Save to our API every x seconds
    const intervalId = setInterval(() => {
      saveGraph();
    }, 1500);

    // cleanup when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    questionQueueRef.current = ["0"];
    qaTreeRef.current = {
      "0": {
        question: props.seedQuery,
        answer: "",
      },
    };
    setResultTree(qaTreeRef.current);

    generatorRef.current = new MultiNodeGenerator(
      2,
      {
        apiKey: props.apiKey,
        model: props.model,
        persona: props.persona,
        questionQueue: questionQueueRef.current,
        qaTree: qaTreeRef.current,
        focusedId: null,
        onChangeQATree: () => {
          setResultTree(JSON.parse(JSON.stringify(qaTreeRef.current)));
        },
        onNodeGenerated: async () => {
          nodeCountRef.current += 1;
          if (nodeCountRef.current >= pauseAtNodeCountRef.current) {
            pause();
          }
          console.log("db- node has been generated, idbRef", idbRef.current);
          if (idbRef.current) {
            console.log("db- saving to db");
            await saveTree(idbRef.current, qaTreeRef.current, treeID);
          }
        },
      },
      (fp) => {
        setFullyPaused(fp);
      }
    );
    generatorRef.current.run();
    return () => {
      generatorRef.current?.destroy();
    };
  }, [props.model, props.persona, props.seedQuery]);

  const [nodeDims, setNodeDims] = useState<NodeDims>({});

  const deleteBranch = useCallback(
    (id: string) => {
      const qaNode = resultTree[id];
      console.log("deleting qaNode, question", qaNode.question);

      if (id in qaTreeRef.current) {
        delete qaTreeRef.current[id];
        setResultTree(JSON.parse(JSON.stringify(qaTreeRef.current)));
      }

      const children = "children" in qaNode ? qaNode.children ?? [] : [];
      for (var child of children) {
        deleteBranch(child);
      }
    },
    [resultTree, setResultTree]
  );

  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, deleteBranch, playing);
  }, [resultTree, playing]);

  function resume() {
    pauseAtNodeCountRef.current = nodeCountRef.current + NODE_LIMIT_PER_PLAY;
    generatorRef.current?.resume();
    setPlaying(true);
  }

  function pause() {
    generatorRef.current?.pause();
    setPlaying(false);
  }

  return (
    <FocusedContextProvider
      qaTree={resultTree}
      onSetFocusedId={(id) => {
        generatorRef.current?.setFocusedId(id);
        const newQueue: string[] = [];
        for (const [id, node] of Object.entries(resultTree)) {
          if (
            !node.children &&
            !node.answer &&
            (id == null || isChild(resultTree, id, id))
          ) {
            newQueue.push(id);
          }
        }
        console.log("setting queue", questionQueueRef.current);
        questionQueueRef.current.splice(
          0,
          questionQueueRef.current.length,
          ...newQueue
        );
        console.log("set queue", questionQueueRef.current);
      }}
    >
      <div className="text-sm">
        <FlowProvider
          flowNodes={nodes}
          flowEdges={edges}
          nodeDims={nodeDims}
          deleteBranch={deleteBranch}
        />
        <div className="fixed right-4 bottom-4 flex items-center space-x-2">
          {SERVER_HOST.includes("localhost") && (
            <div
              className="bg-black/40 p-2 flex items-center justify-center rounded cursor-pointer hover:text-green-400 backdrop-blur"
              onClick={() => {
                // we want to save the current resultTree as JSON
                const filename = props.seedQuery
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                const dict: any = {
                  persona: props.persona,
                  model: props.model,
                  tree: { ...resultTree },
                };
                downloadDataAsJson(dict, filename);
              }}
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </div>
          )}
          <div className="bg-black/40 p-2 pl-3 rounded flex items-center space-x-3 backdrop-blur touch-none">
            <div className="text-white/60 select-none">
              {PERSONAS[props.persona].name} • {MODELS[props.model].name}
            </div>
            <div
              className="rounded-full bg-white/20 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-white/30"
              onClick={() => {
                if (playing) {
                  pause();
                } else {
                  resume();
                }
              }}
            >
              {playing ? (
                <PauseIcon className="w-5 h-5" />
              ) : fullyPaused ? (
                <PlayIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5 animate-pulse" />
              )}
            </div>
          </div>
        </div>
        <div
          onClick={() => {
            props.onExit();
          }}
          className="fixed top-4 left-4 bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur touch-none"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </div>
      </div>
    </FocusedContextProvider>
  );
}

export default GraphPage;
