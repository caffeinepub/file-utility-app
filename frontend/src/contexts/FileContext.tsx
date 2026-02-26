import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AppFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  tab: 'compressor' | 'converter' | 'merger' | 'background' | 'metadata';
  preview?: string;
}

interface FileContextType {
  files: Record<string, AppFile[]>;
  addFiles: (tab: AppFile['tab'], newFiles: File[]) => void;
  removeFile: (tab: AppFile['tab'], id: string) => void;
  clearFiles: (tab: AppFile['tab']) => void;
  getFiles: (tab: AppFile['tab']) => AppFile[];
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<Record<string, AppFile[]>>({
    compressor: [],
    converter: [],
    merger: [],
    background: [],
    metadata: [],
  });

  const addFiles = useCallback((tab: AppFile['tab'], newFiles: File[]) => {
    const appFiles: AppFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      tab,
    }));
    setFiles((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), ...appFiles],
    }));
  }, []);

  const removeFile = useCallback((tab: AppFile['tab'], id: string) => {
    setFiles((prev) => ({
      ...prev,
      [tab]: (prev[tab] || []).filter((f) => f.id !== id),
    }));
  }, []);

  const clearFiles = useCallback((tab: AppFile['tab']) => {
    setFiles((prev) => ({ ...prev, [tab]: [] }));
  }, []);

  const getFiles = useCallback(
    (tab: AppFile['tab']) => files[tab] || [],
    [files]
  );

  return (
    <FileContext.Provider value={{ files, addFiles, removeFile, clearFiles, getFiles }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFileContext must be used within FileProvider');
  return ctx;
}
