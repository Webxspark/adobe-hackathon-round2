export interface ITab {
    url: string;
    title: string;
    id: string;
    fileName?: string;
    info?: ISingleDocumentInfo
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