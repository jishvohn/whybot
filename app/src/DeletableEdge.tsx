import React from "react";
import { getBezierPath } from "reactflow";
import "./DeleteEdge.css";

const foreignObjectSize = 40;

const onEdgeClick = (evt, id, deleteBranch) => {
  evt.stopPropagation();
  console.log(`remove ${id}`);
  const qaNodeIDs = id.split("-");
  console.log("remove", qaNodeIDs);
  if (qaNodeIDs[0] == "a") {
    console.log("remove", qaNodeIDs[3]);
    deleteBranch(qaNodeIDs[3]);
  } else if (qaNodeIDs[0] == "q") {
    console.log("remove", qaNodeIDs[1]);
    deleteBranch(qaNodeIDs[1]);
  }
};

// type DeleteEdgeProps = {
//   id,
//   sourceX,
//   sourceY,
//   targetX,
//   targetY,
//   sourcePosition,
//   targetPosition,
//   style = {},
//   markerEnd,
// }

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={labelX - foreignObjectSize / 2}
        y={labelY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div>
          <button
            className="edgebutton"
            onClick={(event) => onEdgeClick(event, id, data.deleteBranch)}
          >
            ×
          </button>
        </div>
      </foreignObject>
    </>
  );
}
