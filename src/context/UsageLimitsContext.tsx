"use client";

import { createContext, useContext, type ReactNode } from "react";

interface UsageLimitsContextValue {
  canCreateItem: boolean;
  canCreateCollection: boolean;
  isPro: boolean;
}

const UsageLimitsContext = createContext<UsageLimitsContextValue>({
  canCreateItem: true,
  canCreateCollection: true,
  isPro: false,
});

interface UsageLimitsProviderProps {
  children: ReactNode;
  canCreateItem: boolean;
  canCreateCollection: boolean;
  isPro: boolean;
}

export function UsageLimitsProvider({
  children,
  canCreateItem,
  canCreateCollection,
  isPro,
}: UsageLimitsProviderProps) {
  return (
    <UsageLimitsContext.Provider
      value={{ canCreateItem, canCreateCollection, isPro }}
    >
      {children}
    </UsageLimitsContext.Provider>
  );
}

export function useUsageLimits() {
  return useContext(UsageLimitsContext);
}
