export interface StoredAuditLog {
  id: string;
  bookingId: string;
  previousStatus: string | null;
  newStatus: string;
  changedAt: string;
  notes: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __globalAuditStore: StoredAuditLog[] | undefined;
}

export function getAuditLogs(bookingId?: string): StoredAuditLog[] {
  if (!global.__globalAuditStore) {
    global.__globalAuditStore = [];
  }
  if (bookingId) {
    return global.__globalAuditStore.filter((log) => log.bookingId === bookingId);
  }
  return global.__globalAuditStore;
}

export function addAuditLog(log: {
  id?: string;
  bookingId: string;
  previousStatus?: string | null;
  newStatus: string;
  changedAt?: string;
  notes?: string | null;
}): StoredAuditLog {
  if (!global.__globalAuditStore) {
    global.__globalAuditStore = [];
  }

  const entry: StoredAuditLog = {
    id: log.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bookingId: log.bookingId,
    previousStatus: log.previousStatus || null,
    newStatus: log.newStatus,
    changedAt: log.changedAt || new Date().toISOString(),
    notes: log.notes || null,
  };

  global.__globalAuditStore.unshift(entry);
  return entry;
}
