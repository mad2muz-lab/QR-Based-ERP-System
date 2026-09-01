import React, { createContext } from 'react';

export const NotificationContext = createContext({});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Placeholder for future notification state/logic
  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}; 