import {APP_CONFIG} from "@/constants/app.ts";
import type {IAllDocumentInfo, IResponseBatchUpload, ISingleDocumentInfo} from "@/types";

const headers = {
    'Content-Type': 'application/json',
}

export const APIFetchAllDocuments = () :Promise<IAllDocumentInfo[]> => {
    return fetch(`${APP_CONFIG.BACKEND_URL}/documents`, {
        method: 'GET',
        headers
    }).then(res => res.json()) as Promise<IAllDocumentInfo[]>;
}

export const APIBatchUploadDocuments = (files: File[]): Promise<IResponseBatchUpload> => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    return fetch(`${APP_CONFIG.BACKEND_URL}/batch-upload`, {
        method: 'POST',
        body: formData,
    }).then(res => res.json()) as Promise<IResponseBatchUpload>;
}

export const APIFetchSingleDocument = (documentId: string): Promise<ISingleDocumentInfo> => {
    return fetch(`${APP_CONFIG.BACKEND_URL}/documents/${documentId}`, {
        method: 'GET',
        headers
    }).then(res => res.json()) as Promise<ISingleDocumentInfo>;
}