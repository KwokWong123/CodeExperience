import { createContext, useContext, useState } from 'react';

export interface SavedReport {
  id: string;
  title: string;
  subtitle: string;
  type: 'experiment' | 'regulatory' | 'model' | 'analysis' | 'project';
  status: 'draft' | 'published';
  project: string;
  projectColor: string;
  author: string;
  created: string;
  updated: string;
  pages: number;
  tags: string[];
  summary: string;
  sections: { title: string; preview: string }[];
  contentHtml?: string;
}

interface DemoContextType {
  demoStage: number;
  setDemoStage: (stage: number) => void;
  savedReports: SavedReport[];
  saveReport: (report: SavedReport) => void;
  deleteReport: (reportId: string) => void;
  editingReport: SavedReport | null;
  setEditingReport: (report: SavedReport | null) => void;
}

const DemoContext = createContext<DemoContextType>({
  demoStage: 2,
  setDemoStage: () => {},
  savedReports: [],
  saveReport: () => {},
  deleteReport: () => {},
  editingReport: null,
  setEditingReport: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoStage, setDemoStage] = useState(2);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [editingReport, setEditingReport] = useState<SavedReport | null>(null);

  const saveReport = (report: SavedReport) => {
    setSavedReports((prev) => {
      const existing = prev.findIndex((r) => r.id === report.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = report;
        return updated;
      }
      return [...prev, report];
    });
  };

  const deleteReport = (reportId: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  return (
    <DemoContext.Provider value={{ demoStage, setDemoStage, savedReports, saveReport, deleteReport, editingReport, setEditingReport }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoStage() {
  return useContext(DemoContext);
}
