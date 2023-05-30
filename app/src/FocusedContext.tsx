import { createContext, useContext, useState } from "react";
import { ReactNode } from "react";
import { QATree } from "./GraphPage";

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
}

export function FocusedContextProvider(props: FocusedContextProviderProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  function isChild(parentId: string, childId: string): boolean {
    console.log("checking is child", parentId, childId);
    let headId: string | undefined = childId;
    while (headId != null) {
      if (headId === parentId) {
        return true;
      }
      headId = props.qaTree[headId].parent;
    }
    return false;
  }

  function isInFocusedBranch(id: string) {
    if (focusedId === null) {
      return false;
    }
    if (isChild(focusedId, id)) {
      return true;
    }
    if (isChild(id, focusedId)) {
      return true;
    }
    return false;
  }

  return (
    <FocusedContext.Provider
      value={{ focusedId, setFocusedId, isInFocusedBranch }}
    >
      {props.children}
    </FocusedContext.Provider>
  );
}

export function useFocused() {
  return useContext(FocusedContext);
}
