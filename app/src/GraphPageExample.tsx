import { useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { FlowProvider } from "./Flow";
import { convertTreeToFlow, NodeDims, QATree } from "./GraphPage";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Example } from "./StartPage";
import "./GraphPageExample.css";
import { FocusedContextProvider } from "./FocusedContext";

export const streamQuestion = async (
  id: string,
  growingTree: QATree,
  exampleTree: QATree,
  setResultTree: Dispatch<SetStateAction<QATree>>
) => {
  return new Promise((resolve) => {
    const node = exampleTree[id];

    let i = 0;
    const intervalQuestion = setInterval(() => {
      i += 2;
      growingTree[id].question = node.question.slice(0, i);
      setResultTree((prevState) => {
        return { ...prevState, ...growingTree };
      });
      if (i >= node.question.length) {
        clearInterval(intervalQuestion);
        resolve("done streaming question");
      }
    }, 50);
  });
};

export const streamAnswer = async (
  id: string,
  growingTree: QATree,
  exampleTree: QATree,
  setResultTree: Dispatch<SetStateAction<QATree>>
) => {
  return new Promise((resolve) => {
    const node = exampleTree[id];
    let i = 0;
    const intervalAnswer = setInterval(() => {
      i += 2;
      growingTree[id].answer = node.answer.slice(0, i);
      setResultTree((prevState) => {
        return { ...prevState, ...growingTree };
      });
      if (i >= node.answer.length) {
        clearInterval(intervalAnswer);
        resolve("done streaming answer");
      }
    }, 50);
  });
};

export const streamQANode = async (
  id: string,
  growingTree: QATree,
  exampleTree: QATree,
  setResultTree: Dispatch<SetStateAction<QATree>>
) => {
  return new Promise(async (resolve) => {
    // reference text
    const node = exampleTree[id];

    if (!(id in growingTree)) {
      growingTree[id] = {
        question: "",
        answer: "",
        parent: node.parent,
        children: node.children,
      };
    }

    await streamQuestion(id, growingTree, exampleTree, setResultTree);
    await streamAnswer(id, growingTree, exampleTree, setResultTree);
    resolve("done streaming node");
  });
};

export const streamExample = async (
  example: Example,
  setResultTree: Dispatch<SetStateAction<QATree>>
) => {
  const growingTree: QATree = {};
  const exampleTree = example.tree;
  let layer: string[] = ["0"];
  await streamQANode("0", growingTree, exampleTree, setResultTree);
  while (true) {
    if (layer.length === 0) {
      break;
    }
    let nextLayer: string[] = [];
    for (const id of layer) {
      if (id in exampleTree && exampleTree[id].children != null) {
        const children: string[] = exampleTree[id].children!;
        nextLayer = [...nextLayer, ...children];
      }
    }
    const promises = [];
    for (const id of nextLayer) {
      promises.push(streamQANode(id, growingTree, exampleTree, setResultTree));
    }
    await Promise.all(promises);
    layer = nextLayer;
  }
};

type GraphPageExampleProps = {
  example: Example;
  onExit(): void;
};
// `example.tree` holds the complete graph of the example
// `resultTree` is actually rendered & grows over time to become `exampleTree`
// if stream is false, we just render the full graph instantly
export function GraphPageExample({ example, onExit }: GraphPageExampleProps) {
  const [resultTree, setResultTree] = useState<QATree>({});
  const [nodeDims, setNodeDims] = useState<NodeDims>({});
  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, () => {}, true);
  }, [resultTree]);

  useEffect(() => {
    if (example.stream) {
      streamExample(example, setResultTree);
    } else {
      const actualTree = example.tree;
      setResultTree({ ...actualTree });
    }
  }, []);

  return (
    <FocusedContextProvider qaTree={example.tree} onSetFocusedId={() => {}}>
      <div className="text-sm graph-page-example">
        <FlowProvider
          flowNodes={nodes}
          flowEdges={edges}
          nodeDims={nodeDims}
          deleteBranch={() => {}}
        />
        <div
          onClick={() => {
            console.log("boom");
            onExit();
          }}
          className="absolute top-4 left-4 bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur touch-none"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </div>
      </div>
    </FocusedContextProvider>
  );
}

type FullGraphPageProps = {
  example: Example;
  onExit(): void;
};

export function FullGraphPage({ example, onExit }: FullGraphPageProps) {
  const [resultTree] = useState<QATree>(example.tree);
  const [nodeDims, setNodeDims] = useState<NodeDims>({});
  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, () => {}, true);
  }, [resultTree]);

  return (
    <div className="text-sm graph-page-example">
      <FlowProvider
        flowNodes={nodes}
        flowEdges={edges}
        nodeDims={nodeDims}
        deleteBranch={() => {}}
      />
      <div
        onClick={() => {
          console.log("boom");
          onExit();
        }}
        className="absolute top-4 left-4 bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur touch-none"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </div>
    </div>
  );
}
