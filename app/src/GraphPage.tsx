import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowProvider, openai } from "./Flow";
import { Edge, MarkerType, Node } from "reactflow";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import { closePartialJson, downloadDataAsJson } from "./util/json";
import { PERSONAS } from "./personas";
import { ApiKey } from "./App";
import { SERVER_HOST } from "./constants";
import { MODELS, Model } from "./models";

export interface QATreeNode {
  question: string;
  parent?: string;
  answer: string;
  children?: string[];
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
  onChangeQATree: () => void;
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
      opts.questionQueue.push(id);
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
    this.playing = false;
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
  generators: NodeGenerator[];
  onFullyPausedChange: (fullyPaused: boolean) => void;

  constructor(
    n: number,
    opts: NodeGeneratorOpts,
    onFullyPausedChange: (fullyPaused: boolean) => void
  ) {
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
}

function GraphPage(props: {
  seedQuery: string;
  model: string;
  persona: string;
  apiKey: ApiKey;
  onExit(): void;
}) {
  const [resultTree, setResultTree] = useState<QATree>({});
  const questionQueueRef = useRef<string[]>([]);
  const qaTreeRef = useRef<QATree>({});
  const generatorRef = useRef<MultiNodeGenerator>();
  const [playing, setPlaying] = useState(true);
  const [fullyPaused, setFullyPaused] = useState(false);

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
        onChangeQATree: () => {
          setResultTree(JSON.parse(JSON.stringify(qaTreeRef.current)));
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

  useEffect(() => {
    if (playing) {
      generatorRef.current?.resume();
    } else {
      generatorRef.current?.pause();
    }
  }, [playing]);

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

  return (
    <div className="text-sm">
      <FlowProvider
        flowNodes={nodes}
        flowEdges={edges}
        nodeDims={nodeDims}
        deleteBranch={deleteBranch}
      />
      {SERVER_HOST.includes("localhost") && (
        <div
          className="bg-zinc-800 absolute right-20 bottom-4 w-14 h-10 flex items-center justify-center rounded cursor-pointer hover:text-green-400"
          onClick={() => {
            // we want to save the current resultTree as JSON
            const filename = props.seedQuery.toLowerCase().replace(/\s+/g, "-");
            downloadDataAsJson(resultTree, filename);
          }}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
        </div>
      )}
      <div className="bg-zinc-800 absolute right-4 bottom-4 px-4 py-2 rounded">
        <div
          className="rounded-full bg-white/20 w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-white/30"
          onClick={() => {
            setPlaying(!playing);
          }}
        >
          {playing ? (
            <PauseIcon className="w-4 h-4" />
          ) : fullyPaused ? (
            <PlayIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4 animate-pulse" />
          )}
        </div>
      </div>
      <div
        onClick={() => {
          props.onExit();
        }}
        className="absolute top-4 left-4 bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default GraphPage;
