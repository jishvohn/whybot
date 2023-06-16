import { openDB, IDBPDatabase } from "idb";
import { QATree } from "../GraphPage";
import { v4 as uuidv4 } from "uuid";

// base64 encode api key and set in localStorage
export function setApiKeyInLocalStorage(apiKey: string) {
  const encodedApiKey = btoa(apiKey);
  localStorage.setItem("apkls", encodedApiKey);
}

// generate userId, lightly obfuscate by base64-encoding it and put into local storage
function createUserIdInLocalStorage(): string {
  const userId = uuidv4();
  const encoded = btoa(userId);
  localStorage.setItem("uidls", encoded);
  return userId;
}

export function getUserIdOrCreateFromLocalStorage(): string {
  const encoded = localStorage.getItem("uidls");
  if (encoded != null) {
    return atob(encoded);
  }
  return createUserIdInLocalStorage();
}

export function getApiKeyFromLocalStorage() {
  const encodedApiKey = localStorage.getItem("apkls");
  if (encodedApiKey != null) {
    return { key: atob(encodedApiKey), valid: true };
  }
  return { key: "", valid: false };
}

export function clearApiKeyLocalStorage() {
  localStorage.removeItem("apkls");
}

export async function setupDatabase() {
  return await openDB("ChatDatabase", 1, {
    upgrade(db) {
      db.createObjectStore("QATrees", { keyPath: "id" });
    },
  });
}

export type SavedGraph = {
  tree: QATree;
  seedQuery: string;
};

export type SavedGeneration = {
  graphId: string;
  graph: SavedGraph;
  createdAt?: number;
};

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
