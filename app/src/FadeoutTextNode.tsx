import React, { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Handle, Position } from "reactflow";
import "./fadeout-text.css";
import classNames from "classnames";

const getScaleFactor = (): number => {
  const viewportElement = document.querySelector(
    ".react-flow__viewport"
  ) as HTMLElement;

  if (!viewportElement) {
    console.error(
      'Element with the classname "react-flow__viewport" not found'
    );
    return 1; // default scale factor
  }

  const style = getComputedStyle(viewportElement);
  const transformValue = style.transform;

  // Example transform value: matrix(1, 0, 0, 1, 0, 0)
  // The scale factor is the first value in the matrix
  const match = /matrix\((.+),/.exec(transformValue);

  if (!match) {
    console.warn(
      "Unable to find scale factor from the element's transform property"
    );
    return 1; // default scale factor
  }

  return parseFloat(match[1]);
};

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
  const [actualHeight, setActualHeight] = useState(bounds.height);
  useEffect(() => {
    setActualHeight(bounds.height / getScaleFactor());
  }, [bounds.height]);

  return (
    <div
      onClick={() => {
        setExpanded(true);
        // Now I have to call setNodeDims with the nodeID and set the width and height
        props.data.setNodeDims((prevState) => ({
          ...prevState,
          [props.data.nodeID]: { width: 250, height: actualHeight + 36 },
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
          ? actualHeight + 16 + 2
          : Math.min(140 + 16 + 2, actualHeight + 16 + 2),
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
