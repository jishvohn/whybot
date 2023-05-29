import { openDB, IDBPDatabase } from "idb";
import { QATree } from "../GraphPage";

export async function setupDatabase() {
  return await openDB("ChatDatabase", 1, {
    upgrade(db) {
      db.createObjectStore("QATrees", { keyPath: "id" });
    },
  });
}

export type SavedQATree = {
  id: string;
  tree: QATree;
  createdAt: number;
  seedQuery: string;
};

export async function saveTree(db: IDBPDatabase, tree: QATree, id: string) {
  const tx = db.transaction("QATrees", "readwrite");
  const store = tx.objectStore("QATrees");
  const object: SavedQATree = {
    id,
    tree,
    createdAt: Date.now(),
    seedQuery: tree["0"].question,
  };
  await store.put(object);
  return tx.done;
}

export async function getTreeHistory(db: IDBPDatabase) {
  const tx = db.transaction("QATrees", "readonly");
  const store = tx.objectStore("QATrees");
  return await store.getAll();
}

export async function getTree(db: IDBPDatabase, id: string) {
  const tx = db.transaction("QATrees");
  const store = tx.objectStore("QATrees");
  return await store.get(id);
}
