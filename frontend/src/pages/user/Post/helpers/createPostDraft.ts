import type {
  AiSuggestion,
  CreatePostForm,
  PriceSuggestion,
} from "../types/createPost.types";

const DRAFT_KEY = "create-post-draft";
const DATABASE_NAME = "vehicle-marketplace-drafts";
const STORE_NAME = "draft-files";
const FILE_KEY = "create-post";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export type CreatePostDraft = {
  savedAt: number;
  form: CreatePostForm;
  aiSuggestion: AiSuggestion | null;
  priceSuggestion: PriceSuggestion | null;
  showAdditionalVehicleInfo: boolean;
  showPostDetails: boolean;
  isPriceStep: boolean;
};

type DraftFiles = {
  id: string;
  images: File[];
  documentImages: File[];
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function readCreatePostDraft() {
  const value = localStorage.getItem(DRAFT_KEY);
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as CreatePostDraft;
    if (!draft.savedAt || Date.now() - draft.savedAt > MAX_AGE) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function saveCreatePostDraft(draft: CreatePostDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function readCreatePostDraftFiles() {
  const database = await openDatabase();
  return new Promise<Omit<DraftFiles, "id">>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(FILE_KEY);
    request.onsuccess = () => {
      const result = request.result as DraftFiles | undefined;
      resolve({
        images: result?.images ?? [],
        documentImages: result?.documentImages ?? [],
      });
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveCreatePostDraftFiles(
  images: File[],
  documentImages: File[],
) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      id: FILE_KEY,
      images,
      documentImages,
    } satisfies DraftFiles);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearCreatePostDraft() {
  localStorage.removeItem(DRAFT_KEY);
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(FILE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
