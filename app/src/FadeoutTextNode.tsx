import React, { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { Handle, Position } from "reactflow";
import "./fadeout-text.css";
import classNames from "classnames";

type FadeoutTextNodeProps = {
  data: {
    text: string;
    nodeID: string;
    setNodeDims: any;
    question: boolean;
  };
};
export const FadeoutTextNode: React.FC<FadeoutTextNodeProps> = (props) => {
  const [ref, bounds] = useMeasure();
  const [expanded, setExpanded] = useState(false);
  console.log("bounds", bounds);
  console.log("bounds.height", bounds.height >= 135);
  console.log(props.data.text);

  return (
    <div
      onClick={() => {
        setExpanded(true);
        // Now I have to call setNodeDims with the nodeID and set the width and height
        props.data.setNodeDims((prevState) => ({
          ...prevState,
          [props.data.nodeID]: { width: 250, height: bounds.height + 36 },
        }));
      }}
      className={classNames("fadeout-text border", {
        "border-sky-400": props.data.question,
        "border-white/50": !props.data.question,
      })}
      style={{
        position: "relative",
        borderRadius: 4,
        padding: "8px 12px",
        maxWidth: 250,
        overflow: "hidden",
        height: expanded
          ? bounds.height + 16 + 2
          : Math.min(140 + 16 + 2, bounds.height + 16 + 2),
        transition: "all 0.5s",
      }}
    >
      <Handle type={"target"} position={Position.Left} />
      <Handle type={"source"} position={Position.Right} />
      <div
        className="fadeout-text-inner h-[140px]"
        style={expanded ? { WebkitMaskImage: "none" } : {}}
      >
        <div ref={ref}>{props.data.text}</div>
      </div>
    </div>
  );
};
