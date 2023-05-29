import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getTreeHistory, SavedQATree, setupDatabase } from "./util/indexedDB";
import { IDBPDatabase } from "idb";

function HistoryPage() {
  const [history, setHistory] = useState<SavedQATree[]>([]);
  const idbRef = useRef<IDBDatabase>();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const db = await setupDatabase();
        console.log("db- setup database successfully");
        idbRef.current = db;
        const history = await getTreeHistory(db);
        setHistory(history);
        console.log("history", history);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-700 text-white p-4">
      <Link
        to="/"
        className="inline-block bg-black/40 rounded p-2 cursor-pointer hover:bg-black/60 backdrop-blur mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </Link>
      <div className="w-[450px] max-w-full space-y-4">
        {history.map((item) => {
          return (
            <div className="text-white/80 hover:text-white/90 text-lg">
              {item.seedQuery}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HistoryPage;
