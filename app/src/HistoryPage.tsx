import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface HistoryItem {
  prompt: string;
  id: string;
}

function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const history = localStorage.getItem("history");
    setHistory(history ? JSON.parse(history) : []);
  });

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
              {item.prompt}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HistoryPage;
