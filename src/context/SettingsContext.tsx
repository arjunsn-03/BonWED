"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { AppSettings } from "@/lib/types";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/collections";

interface SettingsContextValue {
  settings: AppSettings | null;
  loading: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  engagementDate: null,
  marriageDate: null,
  primaryColor: "#be185d",
  updatedAt: 0,
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useFirestoreDoc<AppSettings>(
    COLLECTIONS.settings,
    SETTINGS_DOC_ID
  );

  return (
    <SettingsContext.Provider value={{ settings: data ?? DEFAULT_SETTINGS, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
