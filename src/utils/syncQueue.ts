export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  dashboardId: string;
  payload: any;
  timestamp: number;
  version?: number;
  updatedAt?: string;
}

const LOCAL_STORAGE_KEY = 'dashboardSyncQueue';

function loadQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueItem[];
  } catch (e) {
    console.error('Failed to load sync queue:', e);
    return [];
  }
}

function saveQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): void {
  const queue = loadQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    version: item.version,
    updatedAt: item.updatedAt,
  };
  queue.push(newItem);
  saveQueue(queue);
}

export function getSyncQueue(): SyncQueueItem[] {
  return loadQueue();
}

export function removeFromSyncQueue(id: string): void {
  const queue = loadQueue();
  const updated = queue.filter(item => item.id !== id);
  saveQueue(updated);
}

export function clearSyncQueue(): void {
  saveQueue([]);
}

/**
 * Process the sync queue. For each item, call the provided async callback.
 * If the callback resolves (returns true), remove the item from the queue.
 * If it fails (returns false or throws), keep the item for retry.
 */
export async function processSyncQueue(
  processItem: (item: SyncQueueItem) => Promise<boolean>
): Promise<void> {
  const queue = loadQueue();
  for (const item of queue) {
    try {
      const success = await processItem(item);
      if (success) {
        removeFromSyncQueue(item.id);
      }
    } catch (e) {
      console.error('Error processing sync queue item:', e);
      // Keep the item for retry
    }
  }
} 