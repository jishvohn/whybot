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
import { getFingerprint } from "./main";
import { SERVER_HOST_WS } from "./constants";

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

  // Layout magic happens
  dagre.layout(dagreGraph);

  // By default, as more nodes are added to our expanding tree,
  // the graph moves down (on the screen). By the time the final node has been added,
  // the root node has shifted > 1000 pixels downwards (as per dagre layouting).
  // To make the experience better for the user, we want to move the entire graph up
  // so that the root node (question & answer) are both at the top of the screen and never change
  // their position. So we need to move the entire graph up.
  let moveUp = 0;
  nodes.forEach((node) => {
    if (node.id == "q-0") {
      const nodeWithPosition = dagreGraph.node(node.id);
      moveUp = nodeWithPosition.y - 60;
    }
  });

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2 + 60,
      // y: nodeWithPosition.y - nodeHeight / 2 + 60,
      y: nodeWithPosition.y - moveUp,
    };

    return node;
  });

  return { nodes, edges };
};

export const openai_browser = async (
  prompt: string,
  opts: {
    apiKey: string;
    model: string;
    temperature: number;
    onChunk: (chunk: string) => void;
  }
) => {
  return new Promise(async (resolve, reject) => {
    if (opts.temperature < 0 || opts.temperature > 1) {
      console.error(
        `Temperature is set to an invalid value: ${opts.temperature}`
      );
      return;
    }
    const params = {
      model: opts.model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Non-JSON answers should be short, with a _max_ of 100 words.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: opts.temperature,
      n: 1,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      body: JSON.stringify(params),
      headers,
    });
    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    StreamLoop: while (true) {
      const { value } = await reader.read();
      try {
        const maybeError = JSON.parse(value);
        if ("error" in maybeError) {
          reject(maybeError.error.message);
          break StreamLoop;
        }
      } catch (error) {}
      const lines = value.split("\n").filter((l) => l.trim() !== "");
      for (const line of lines) {
        const maybeJsonString = line.replace(/^data: /, "");
        // console.log("maybeJsonString", maybeJsonString);
        if (maybeJsonString == "[DONE]") {
          resolve("stream is done");
          break StreamLoop;
        }
        try {
          const payload = JSON.parse(maybeJsonString);
          const completion = payload.choices[0].delta.content;
          if (completion != null) {
            opts.onChunk(completion);
          }
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
  opts: {
    model: string;
    temperature: number;
    onChunk: (chunk: string) => void;
  }
) => {
  const fingerprint = await getFingerprint();
  return new Promise((resolve, reject) => {
    if (opts.temperature < 0 || opts.temperature > 1) {
      console.error(
        `Temperature is set to an invalid value: ${opts.temperature}`
      );
      return;
    }
    // Establish a WebSocket connection to the server
    const ws = new WebSocket(`${SERVER_HOST_WS}/ws?fp=${fingerprint}`);
    // Send a message to the server to start streaming
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          prompt,
          model: opts.model,
          temperature: opts.temperature,
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
        opts.onChunk(message);
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
  prompt: string,
  opts: {
    apiKey?: string;
    model: string;
    temperature: number;
    onChunk: (chunk: string) => void;
  }
) => {
  if (opts.apiKey) {
    console.log("yo using the browser api key");
    return openai_browser(prompt, {
      apiKey: opts.apiKey,
      model: opts.model,
      temperature: opts.temperature,
      onChunk: opts.onChunk,
    });
  }
  return openai_server(prompt, {
    model: opts.model,
    temperature: opts.temperature,
    onChunk: opts.onChunk,
  });
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
    <div className="w-full h-full fixed top-0 left-0">
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
