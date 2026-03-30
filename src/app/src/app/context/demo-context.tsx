import { createContext, useContext, useState } from 'react';

interface DemoContextType {
  demoStage: number;
  setDemoStage: (stage: number) => void;
}

const DemoContext = createContext<DemoContextType>({
  demoStage: 2,
  setDemoStage: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoStage, setDemoStage] = useState(2);
  return (
    <DemoContext.Provider value={{ demoStage, setDemoStage }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoStage() {
  return useContext(DemoContext);
}
