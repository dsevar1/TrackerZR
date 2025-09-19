import { createContext, useEffect } from 'react';
import { syncWithServer } from './syncWithServer';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  useEffect(() => {
    console.log('[Sync] Starting background sync loop...');
    const interval = setInterval(() => {
      console.log('[Sync] Attempting to sync with server...');
      syncWithServer();
    }, 30000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <SyncContext.Provider value={{}}>
      {children}
    </SyncContext.Provider>
  );
}
