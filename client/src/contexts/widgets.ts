import {create} from "zustand";

interface IWidgetContext {
    connectDotsOpen: boolean;
    setConnectDotsOpen: (open: boolean) => void;
    connectDotsSessionData: {
        selectedText: string;
        context: string;
        filename: string;
    }
    setConnectDotsSessionData: (data: { selectedText: string; context: string; filename: string }) => void;
}

export const useWidgetsContext = create<IWidgetContext>((set, get) => ({
    connectDotsOpen: false,
    setConnectDotsOpen: (open: boolean) => set({connectDotsOpen: open}),
    connectDotsSessionData: {
        selectedText: '',
        context: '',
        filename: ''
    },
    setConnectDotsSessionData: (data: { selectedText: string; context: string; filename: string }) => set({
        connectDotsSessionData: {...get().connectDotsSessionData, ...data}
    })

}));