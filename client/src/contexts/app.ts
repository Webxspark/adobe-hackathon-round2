import {create} from "zustand";
import type {ITab} from "@/types";

interface AppState {
    tabs: ITab[],
    addTab: (tab: ITab) => number,
    removeTab: (idx: number) => void,
    activeTab: number | null,
    setActiveTab: (idx: number | null) => void,
}

export const useAppContext = create<AppState>((set, get) => ({
    tabs: [],
    addTab: (tab: ITab) => {
        set((state) => {
            const newTabs = [...state.tabs, tab];
            return {
                tabs: newTabs,
                activeTab: newTabs.length - 1 // Set the newly added tab as active
            };
        });
        return get().tabs.length - 1; // Return the index of the newly added tab
    },
    removeTab: (idx: number) => {
        set((state) => {
            const newTabs = state.tabs.filter((_, index) => index !== idx);
            let newActiveTab: number | null;

            if (newTabs.length === 0) {
                // No tabs left
                newActiveTab = null;
            } else if (state.activeTab === null) {
                // No active tab before, set first tab as active
                newActiveTab = 0;
            } else if (idx < state.activeTab) {
                // Removed tab was before active tab, shift active tab index down
                newActiveTab = state.activeTab - 1;
            } else if (idx === state.activeTab) {
                // Removed tab was the active tab
                if (idx >= newTabs.length) {
                    // Removed tab was the last tab, activate the new last tab
                    newActiveTab = newTabs.length - 1;
                } else {
                    // Activate the tab that took the removed tab's position
                    newActiveTab = idx;
                }
            } else {
                // Removed tab was after active tab, keep active tab index unchanged
                newActiveTab = state.activeTab;
            }


            return {
                tabs: newTabs,
                activeTab: newActiveTab
            };
        });
    },
    activeTab: null,
    setActiveTab: (idx: number | null) => set(() => ({
        activeTab: idx
    }))
}))