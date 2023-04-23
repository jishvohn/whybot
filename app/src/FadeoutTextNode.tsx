import React, { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { Handle, Position } from "reactflow";
import "./fadeout-text.css";

type FadeoutTextNodeProps = {
  data: {
    text: string;
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
      }}
      className="fadeout-text"
      style={{
        position: "relative",
        border: "1px solid skyblue",
        borderRadius: 4,
        padding: "8px 12px",
        maxWidth: 250,
        overflow: "hidden",
        height: expanded
          ? bounds.height + 16
          : Math.min(140 + 16, bounds.height + 16),
        // transition: "all 0.5s",
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

      {/*<div ref={containerRef} style={{*/}
      {/*    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px',*/}
      {/*    // backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))'*/}
      {/*    background: 'linear-gradient(to bottom, rgba(57, 56, 60, 0), #39383C)'*/}
      {/*}}></div>*/}
    </div>
  );
};
