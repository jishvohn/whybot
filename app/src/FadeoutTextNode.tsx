import React, { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { Handle, Position } from "reactflow";

type FadeoutTextNodeProps = {
  data: {
    text: string;
  };
};
export const FadeoutTextNode: React.FC<FadeoutTextNodeProps> = (props) => {
  const [ref, bounds] = useMeasure();
  console.log("bounds", bounds);
  console.log("bounds.height", bounds.height >= 135);
  console.log(props.data.text);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        border: "1px solid skyblue",
        padding: "10px",
          minWidth: "250px",
        maxWidth: "250px",
        maxHeight: "140px",
        overflow: "hidden",
      }}
    >
      <Handle type={"target"} position={Position.Left} />
      <Handle type={"source"} position={Position.Right} />
      <div style={{maxHeight: "140px",
          WebkitMaskImage:
            bounds.height >= 95
              ? "linear-gradient(to top, transparent, black 160px)"
              : "none",
      }}>
        {props.data.text}
      </div>
      {/*<div ref={containerRef} style={{*/}
      {/*    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px',*/}
      {/*    // backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))'*/}
      {/*    background: 'linear-gradient(to bottom, rgba(57, 56, 60, 0), #39383C)'*/}
      {/*}}></div>*/}
    </div>
  );
};
