import React, { useEffect } from "react";

import ReactFlow, {
  Edge,
  Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import dagre from "dagre";

import "reactflow/dist/style.css";
import { FadeoutTextNode } from "./FadeoutTextNode";
import { DeletableEdge } from "./DeletableEdge";
import { NodeDims } from "./GraphPage";
import { ApiKey } from "./App";

const nodeTypes = { fadeText: FadeoutTextNode };
const edgeTypes = { deleteEdge: DeletableEdge };

// Layout the nodes automatically
const layoutElements = (
  nodes: Node[],
  edges: Edge[],
  nodeDims: NodeDims,
  direction = "LR"
) => {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 250;
  const nodeHeight = 170;
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100 });

  nodes.forEach((node) => {
    if (node.id in nodeDims) {
      dagreGraph.setNode(node.id, {
        width: nodeDims[node.id]["width"],
        height: nodeDims[node.id]["height"],
      });
    } else {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2 + 30,
      y: nodeWithPosition.y - nodeHeight / 2 + 30,
    };

    return node;
  });

  return { nodes, edges };
};

export const openai_browser = async (
  apiKey: string,
  prompt: string,
  temperature: number,
  onChunk: (chunk: string) => void
) => {
  return new Promise(async (resolve, reject) => {
    if (temperature < 0 || temperature > 1) {
      console.error(`Temperature is set to an invalid value: ${temperature}`);
      return;
    }
    const params = {
      model: "text-davinci-003",
      stream: true,
      prompt: prompt,
      max_tokens: 100,
      temperature: temperature,
      n: 1,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "post",
      body: JSON.stringify(params),
      headers,
    });
    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    StreamLoop: while (true) {
      const { value } = await reader.read();
      console.log("value", value);
      const lines = value.split("\n").filter((l) => l.trim() !== "");
      for (const line of lines) {
        const maybeJsonString = line.replace(/^data: /, "");
        if (maybeJsonString == "[DONE]") {
          resolve("stream is done");
          break StreamLoop;
        }
        try {
          const payload = JSON.parse(maybeJsonString);
          const completion = payload.choices[0].text;
          onChunk(completion);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      }
    }
  });
};

export const openai_server = async (
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
    const ws = new WebSocket("wss://whybot.herokuapp.com/ws");
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
        // console.log("Received data:", message);
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

// Function to get streaming openai completion
export const openai = async (
  apiKey: ApiKey,
  prompt: string,
  temperature: number,
  onChunk: (chunk: string) => void
) => {
  if (apiKey.valid) {
    console.log("yo using the browser api key");
    return openai_browser(apiKey.key, prompt, temperature, onChunk);
  }
  return openai_server(prompt, temperature, onChunk);
};

type FlowProps = {
  flowNodes: Node[];
  flowEdges: Edge[];
  nodeDims: NodeDims;
  deleteBranch: (id: string) => void;
};
export const Flow: React.FC<FlowProps> = (props) => {
  const [nodes, setNodes, onNodesChangeDefault] = useNodesState<Node[]>(
    props.flowNodes
  );
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState<Edge[]>(
    props.flowEdges
  );

  // when props.flowNodes changes, then I need to call setNodes
  useEffect(() => {
    setNodes(() => {
      return props.flowNodes;
    });
  }, [props.flowNodes]);

  useEffect(() => {
    setEdges(() => {
      return props.flowEdges;
    });
  }, [props.flowEdges]);

  // console.log("props.flowNodes", props.flowNodes)
  // console.log("nodes", nodes)

  const laid = React.useMemo(
    () => layoutElements(nodes, edges, props.nodeDims),
    [nodes, edges, props.nodeDims]
  );

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        // fitView
        panOnScroll
        minZoom={0.1}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={laid.nodes}
        edges={laid.edges}
        onNodesChange={onNodesChangeDefault}
        onEdgesChange={onEdgesChangeDefault}
        {...props}
      ></ReactFlow>
    </div>
  );
};

type FlowProviderProps = {
  flowNodes: Node[];
  flowEdges: Edge[];
  nodeDims: NodeDims;
  deleteBranch: (id: string) => void;
};
export const FlowProvider: React.FC<FlowProviderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
};
