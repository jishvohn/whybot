import { createContext, useContext, useState } from "react";
import { ReactNode } from "react";
import { QATree } from "./GraphPage";

export function isChild(
  qaTree: QATree,
  parentId: string,
  childId: string
): boolean {
  let headId: string | undefined = childId;
  while (headId != null) {
    if (headId === parentId) {
      return true;
    }
    headId = qaTree[headId].parent;
  }
  return false;
}

interface FocusedContextValue {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  isInFocusedBranch(id: string): boolean;
}

export const FocusedContext = createContext<FocusedContextValue>(
  undefined as any
);

interface FocusedContextProviderProps {
  qaTree: QATree;
  children: ReactNode;
  onSetFocusedId: (id: string | null) => void;
}

export function FocusedContextProvider(props: FocusedContextProviderProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  function isInFocusedBranch(id: string) {
    if (focusedId === null) {
      return false;
    }
    if (isChild(props.qaTree, focusedId, id)) {
      return true;
    }
    if (isChild(props.qaTree, id, focusedId)) {
      return true;
    }
    return false;
  }

  return (
    <FocusedContext.Provider
      value={{
        focusedId,
        setFocusedId: (newFocusedId) => {
          setFocusedId(newFocusedId);
          props.onSetFocusedId(newFocusedId);
        },
        isInFocusedBranch,
      }}
    >
      {props.children}
    </FocusedContext.Provider>
  );
}

export function useFocused() {
  return useContext(FocusedContext);
}
