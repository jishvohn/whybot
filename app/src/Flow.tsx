import React from "react";
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
import { Input } from "semantic-ui-react";

import "reactflow/dist/style.css";

const layoutElements = (nodes: any, edges: any, direction = "LR") => {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 70;
  dagreGraph.setGraph({ rankdir: direction });

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

const openai = async (setMessages) => {
  // Establish a WebSocket connection to the server
  const ws = new WebSocket('ws://localhost:6823/ws');
  // Send a message to the server to start streaming
  ws.onopen = () => {
    ws.send(JSON.stringify({prompt: "Give me a brief recap of how World War I started."}));
  }
  // Listen for streaming data from the server
  ws.onmessage = (event) => {
    console.log("event", event)
    const message = event.data;
    // Check if the stream has ended
    if (message === '[DONE]') {
      console.log('Stream has ended');
    } else {
      // Handle streaming data
      console.log('Received data:', message);
      // Send data to be displayed
      setMessages((prevMessages) => [...prevMessages, message])
    }
  };

  // Handle the WebSocket "error" event
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  // Handle the WebSocket "close" event
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
  };

};

export function Flow(props) {
  const { fitView } = useReactFlow();
  const [messages, setMessages] = React.useState([])

  const [nodes, setNodes, onNodesChangeDefault] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState([]);

  const laid = React.useMemo(
    () => layoutElements(nodes, edges),
    [nodes, edges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Input
        placeholder={"Type here..."}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setNodes((prevState) => {
              return [
                ...prevState,
                {
                  id: `${nodes.length + 1}`,
                  position: { x: 0, y: 0 },
                  data: { label: e.target.value },
                },
              ];
            });
            openai(setMessages)
            setTimeout(fitView, 0);
          }
        }}
      />
      <div>
        <h1>Server Response:</h1>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
      <ReactFlow
        fitView
        nodes={laid.nodes}
        edges={laid.edges}
        onNodesChange={onNodesChangeDefault}
        onEdgesChange={onEdgesChangeDefault}
        {...props}
      >
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function FlowProvider(props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
