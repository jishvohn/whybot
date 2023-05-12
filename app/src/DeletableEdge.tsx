import { getBezierPath } from "reactflow";
import "./DeletableEdge.css";

const onEdgeClick = (
  evt: any,
  id: string,
  deleteBranch: (id: string) => void
) => {
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

type DeletableEdgeProps = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  style: any;
  targetPosition: any;
  data: any;
};

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: DeletableEdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <g className={"contains-path-and-arrow"}>
        <defs>
          <marker
            className="react-flow__arrowhead"
            id={`${id}-marker`}
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              id={`${id}-poly`}
              stroke="#b1b1b7"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              fill="none"
              points="-5,-4 0,0 -5,4"
            ></polyline>
          </marker>
        </defs>
        <path
          id={id}
          style={style}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={`url(#${id}-marker)`}
          onClick={(event) => {
            onEdgeClick(event, id, data.deleteBranch);
            console.log("clicked path");
          }}
        />
        <path
          id={`${id}-fat`}
          style={style}
          className="fat-path"
          d={edgePath}
          onClick={(event) => {
            onEdgeClick(event, id, data.deleteBranch);
            console.log("clicked fat path");
          }}
        />
      </g>
    </>
  );
}
