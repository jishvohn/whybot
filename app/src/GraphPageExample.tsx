import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowProvider, openai } from "./Flow";
import { Edge, MarkerType, Node } from "reactflow";
import { convertTreeToFlow, NodeDims, QATree } from "./GraphPage";

// Here is where we play saved examples
// I'll serialize a QATree to JSON
// and play it from the client as a prototype
// and then we'll focus on server stuff.

type GraphPageExampleProps = {
  exampleTree: QATree;
};
export function GraphPageExample({ exampleTree }: GraphPageExampleProps) {
  const [resultTree, setResultTree] = useState<QATree>({});
  const [nodeDims, setNodeDims] = useState<NodeDims>({});
  // We're doing BFS on exampleTree
  // We always have a list of nodes at the current layer
  // and a list of nodes at the next layer
  const { nodes, edges } = useMemo(() => {
    return convertTreeToFlow(resultTree, setNodeDims, () => {}, true);
  }, [resultTree]);

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
