import { createContext, useContext, ReactNode } from 'react';

interface MobileContextType {
  isMobileMode: boolean;
}

const MobileContext = createContext<MobileContextType>({ isMobileMode: false });

export function useMobile() {
  return useContext(MobileContext);
}

interface MobileProviderProps {
  children: ReactNode;
  isMobile: boolean;
}

export function MobileProvider({ children, isMobile }: MobileProviderProps) {
  return (
    <MobileContext.Provider value={{ isMobileMode: isMobile }}>
      {children}
    </MobileContext.Provider>
  );
}
