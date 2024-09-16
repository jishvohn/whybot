import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getTree,
  getTreeHistory,
  SavedQATree,
  setupDatabase,
} from "./util/localStorage";
import { Example } from "./StartPage";
import { QATree } from "./GraphPage";

type HistoryItemsProps = {
  setExample: (example: Example) => void;
};

export function HistoryItems(props: HistoryItemsProps) {
  const [historyItems, setHistory] = useState<SavedQATree[]>([]);
  const idbRef = useRef<IDBDatabase>();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const db = await setupDatabase();
        console.log("db- setup database successfully");
        idbRef.current = db;
        const history = await getTreeHistory(db);
        setHistory(history);
        console.log("history", historyItems);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-full space-y-4">
      {historyItems.map((h) => {
        return (
          <div
            className="text-white/80 hover:text-white/90 text-sm cursor-pointer"
            onClick={() => {
              // TODO: Render tree in new url
              getTree(idbRef.current, h.id).then((saved: SavedQATree) => {
                props.setExample({ tree: saved.tree, stream: false });
              });
            }}
          >
            {h.seedQuery}
          </div>
        );
      })}
    </div>
  );
}
