import {create} from "zustand";
import type {IAllDocumentInfo, ISingleDocumentInfo, ITab} from "@/types";

interface AppState {
    tabs: ITab[],
    addTab: (tab: ITab) => number,
    updateTab: (idx: number, tab: ITab) => void,
    removeTab: (idx: number) => void,
    activeTab: number | null,
    setActiveTab: (idx: number | null) => void,
    nextTab: () => void,
    previousTab: () => void,
    documents: IAllDocumentInfo[],
    setDocuments: (docs: IAllDocumentInfo[]) => void,
    documentRefresh: boolean,
    setDocumentRefresh: (value: boolean) => void,
    singleDocuments: {
        [key: string]: ISingleDocumentInfo | undefined
    },
    setSingleDocument: (id: string, doc: ISingleDocumentInfo) => void;
    pdfEmbedAPI: string,
    setPdfEmbedAPI: (url: string) => void;
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
    updateTab: (idx: number, tab: ITab) => {
        set((state) => {
            const newTabs = [...state.tabs];
            newTabs[idx] = tab; // Update the tab at the specified index
            return {
                tabs: newTabs,
                activeTab: state.activeTab === idx ? idx : state.activeTab // Keep active tab unchanged unless it's the one being updated
            };
        });
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
                activeTab: state.activeTab === null ? null : newActiveTab
            };
        });
    },
    activeTab: null,
    setActiveTab: (idx: number | null) => set(() => ({
        activeTab: idx
    })),
    nextTab: () => set((state) => {
        if (state.tabs.length === 0) return state; // No tabs to switch to
        const nextIndex = state.activeTab === null ? 0 : (state.activeTab + 1) % state.tabs.length;
        return {activeTab: nextIndex};
    }),
    previousTab: () => set((state) => {
        if (state.tabs.length === 0) return state; // No tabs to switch to
        const prevIndex = state.activeTab === null ? state.tabs.length - 1 : (state.activeTab - 1 + state.tabs.length) % state.tabs.length;
        return {activeTab: prevIndex};
    }),
    documents: [],
    setDocuments: (docs: IAllDocumentInfo[]) => set(() => ({
        documents: docs
    })),
    documentRefresh: false,
    setDocumentRefresh: (value: boolean) => set(() => ({
        documentRefresh: value
    })),
    singleDocuments: {},
    setSingleDocument: (id: string, doc: ISingleDocumentInfo) => set((state) => {
        return {
            singleDocuments: {
                ...state.singleDocuments,
                [id]: doc
            }
        };
    }),
    pdfEmbedAPI: "",
    setPdfEmbedAPI: (url: string) => set(() => ({
        pdfEmbedAPI: url
    }))
}))