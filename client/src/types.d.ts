export interface ITab {
    url: string;
    title: string;
    id: string;
    fileName?: string;
    info?: ISemanticSearchResult | undefined;
}

export interface IDocumentOutline {
    level: string;
    text: string;
    page: number;
}

export interface IDocumentSection {
    id: string;
    title: string;
    content: string;
    section_number: number;
    page_number: number;
    snippet: string;
}

export interface IAllDocumentInfo {
    id: string;
    filename: string;
    title: string;
    original_filename: string;
    upload_time: string;
    total_sections: number;
    file_size: number;
    processing_status: string;
    outline: IDocumentOutline[]
}

export interface ISingleDocumentInfo {
    document: IAllDocumentInfo;
    sections: IDocumentSection[];
}

export interface IResponseBatchUploadResult {
    filename: string;
    document_id: string;
    status: string;
    success: boolean;
}

export interface IResponseBatchUpload {
    total_files: number;
    successful_uploads: number;
    message: string;
    results: IResponseBatchUploadResult[];
}

export interface ISemanticSearchResult {
    id: string;
    document_id: string;
    document_title: string;
    document_filename: string;
    section_title: string;
    snippet: string;
    page_number: number;
    relevance_score: number;
}

export interface IConnectDotsResponse {
    query: string;
    processing_time: number;
    results: ISemanticSearchResult[];
}

export interface IInsightGenerationResponse {
    selected_text: string;
    insight_type: string;
    insights: string;
    related_sections_count: number;
    grounded_in_documents: boolean;
}

export interface IAudioGenerationResponse {
    success: boolean;
    audio_file: string;
    script: string;
    duration_estimate: string;
    audio_type: string;
    sections_included: number;
}