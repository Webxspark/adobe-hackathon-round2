import {create} from "zustand";
import type {IDocumentSection, IInsightGenerationResponse} from "@/types";

interface IWidgetContext {
    connectDotsOpen: boolean;
    setConnectDotsOpen: (open: boolean) => void;
    connectDotsSessionData: {
        selectedText: string;
        context: string;
        filename: string;
    }
    setConnectDotsSessionData: (data: { selectedText: string; context: string; filename: string }) => void;


    showOptions: boolean;
    setShowOptions: (show: boolean) => void;
    showOptionsSessionData: {
        page_number: number;
        sections: IDocumentSection[]
    };
    setShowOptionsSessionData: (data: IDocumentSection[], page_number: number) => void;


    insightsOpen: boolean;
    setInsightsOpen: (open: boolean) => void;
    insightsSessionData: IInsightGenerationResponse;
    setInsightsSessionData: (data: IInsightGenerationResponse) => void;


    audioPlayerOpen: boolean;
    setAudioPlayerOpen: (open: boolean) => void;
    audioPlayerSessionData: {
        audioUrl: string;
        title: string;
    }
    setAudioPlayerSessionData: (data: { audioUrl: string; title: string }) => void;
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
    }),


    showOptions: false,
    setShowOptions: (show: boolean) => set({showOptions: show}),
    showOptionsSessionData: {
        page_number: 0,
        sections: []
    },
    setShowOptionsSessionData: (sections: IDocumentSection[], page_number: number) => set({
        showOptionsSessionData: {
            page_number,
            sections: sections
        }
    }),


    insightsOpen: false,
    setInsightsOpen: (open: boolean) => set({insightsOpen: open}),
    insightsSessionData: {
        selected_text: '',
        insight_type: '',
        insights: '',
        grounded_in_documents: false,
        related_sections_count: 0
    },
    setInsightsSessionData: (data: IInsightGenerationResponse) => set({
        insightsSessionData: {...get().insightsSessionData, ...data}
    }),

    audioPlayerOpen: false,
    setAudioPlayerOpen: (open: boolean) => {
        if (!open) {
            set({
                audioPlayerSessionData: {
                    audioUrl: '',
                    title: ''
                }
            });
        }
        set({audioPlayerOpen: open});
    },
    audioPlayerSessionData: {
        audioUrl: '',
        title: ''
    },
    setAudioPlayerSessionData: (data: { audioUrl: string; title: string }) => set({
        audioPlayerSessionData: {...get().audioPlayerSessionData, ...data}
    })
}));