import { useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { FlowProvider } from "./Flow";
import { convertTreeToFlow, NodeDims, QATree } from "./GraphPage";

// Play saved examples
// Now how do we want to do this?
// I want a save button that saves the current graph to JSON
// And then how do we want to render this in the UI?

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
    }, 75);
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
    }, 75);
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
  exampleTree: QATree,
  setResultTree: Dispatch<SetStateAction<QATree>>
) => {
  const growingTree: QATree = {};
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
  exampleTree: QATree;
};
// `exampleTree` holds the complete graph of the example
// `resultTree` is actually rendered & grows over time to become `exampleTree`
export function GraphPageExample({ exampleTree }: GraphPageExampleProps) {
  const [resultTree, setResultTree] = useState<QATree>({});
  const [nodeDims, setNodeDims] = useState<NodeDims>({});
  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, () => {}, true);
  }, [resultTree]);

  useEffect(() => {
    streamExample(exampleTree, setResultTree);
  }, []);

  return (
    <div className="text-sm">
      <FlowProvider
        flowNodes={nodes}
        flowEdges={edges}
        nodeDims={nodeDims}
        deleteBranch={() => {}}
      />
    </div>
  );
}
