import React, { createContext, useState, useContext } from 'react';

const ExportContext = createContext(null);

export const ExportProvider = ({ children }) => {
  const [exportFunction, setExportFunction] = useState(null);

  const registerExportFunction = (func) => {
    setExportFunction(() => func);
  };

  const unregisterExportFunction = () => {
    setExportFunction(null);
  };

  return (
    <ExportContext.Provider value={{ exportFunction, registerExportFunction, unregisterExportFunction }}>
      {children}
    </ExportContext.Provider>
  );
};

export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};