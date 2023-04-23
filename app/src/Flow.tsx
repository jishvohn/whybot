import React, {useEffect} from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import dagre from "dagre";

import "reactflow/dist/style.css";
import {initialNodes, initialEdges} from "./initialElements";
import {FadeoutTextNode} from "./FadeoutTextNode";

const nodeTypes = {fadeText: FadeoutTextNode}
// The most important thing I can do right now is styling the individual nodes
// Okay. Let me create a custom node

// Layout the nodes automatically
const layoutElements = (nodes: any, edges: any, direction = "LR") => {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 250;
  const nodeHeight = 140;
  dagreGraph.setGraph({ rankdir: direction});

  nodes.forEach((node: any) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node: any) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? "left" : "top";
    node.sourcePosition = isHorizontal ? "right" : "bottom";

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

// Function to get streaming openai completion
export const openai = async (
  prompt: string,
  temperature: number,
  onChunk: (chunk: string) => void
) => {
  return new Promise((resolve, reject) => {
    if (temperature < 0 || temperature > 1) {
      console.error(`Temperature is set to an invalid value: ${temperature}`);
      return;
    }
    // Establish a WebSocket connection to the server
    const ws = new WebSocket("ws://localhost:6823/ws");
    // Send a message to the server to start streaming
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          prompt,
          temperature,
        })
      );
    };
    // Listen for streaming data from the server
    ws.onmessage = (event) => {
      const message = event.data;
      // Check if the stream has ended
      if (message === "[DONE]") {
        console.log("Stream has ended");
        resolve(message);
        ws.close();
      } else {
        // Handle streaming data
        console.log("Received data:", message);
        // Send data to be displayed
        onChunk(message);
      }
    };

    // Handle the WebSocket "error" event
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      reject(error);
    };

    // Handle the WebSocket "close" event
    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
    };
  });
};

type FlowProps = {
  flowNodes: any;
  flowEdges: any;
};
export const Flow: React.FC<FlowProps> = (props) => {
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChangeDefault] = useNodesState(props.flowNodes);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState(props.flowEdges);

  // when props.flowNodes changes, then I need to call setNodes
  useEffect(() => {
    setNodes((prevNodes) => {return props.flowNodes})
  }, [props.flowNodes])

  useEffect(() => {
    setEdges((prevNodes) => {return props.flowEdges})
  }, [props.flowEdges])

  // console.log("props.flowNodes", props.flowNodes)
  // console.log("nodes", nodes)

  const laid = React.useMemo(
    () => layoutElements(nodes, edges),
    [nodes, edges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh", marginTop: "30px", marginLeft: "30px" }}>
      <ReactFlow
        // fitView
        minZoom={0.1}
        nodeTypes={nodeTypes}
        nodes={laid.nodes}
        edges={laid.edges}
        onNodesChange={onNodesChangeDefault}
        onEdgesChange={onEdgesChangeDefault}
        {...props}
      >
      </ReactFlow>
    </div>
  );
};

type FlowProviderProps = {
  flowNodes: any;
  flowEdges: any;
};
export const FlowProvider: React.FC<FlowProviderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
};
