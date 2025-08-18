import {APP_CONFIG} from "@/constants/app.ts";
import type {IAllDocumentInfo, IConnectDotsResponse, IResponseBatchUpload, ISingleDocumentInfo} from "@/types";

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

export const APIConnectDots = (selected_text: string, context: string, max_results: number = 5):Promise<IConnectDotsResponse> => {
    const reqBody = new FormData();
    reqBody.append('selected_text', selected_text);
    if(context && context.trim() !== '') {
        reqBody.append('context', context);
    }
    reqBody.append('max_results', max_results.toString());

    const finalRequestBody = JSON.stringify(Object.fromEntries(reqBody.entries()));
    return fetch(`${APP_CONFIG.BACKEND_URL}/connect-dots`, {
        method: 'POST',
        body: finalRequestBody,
        headers: {
            ...headers,
            'Accept': 'application/json',
        }
    }).then(res => res.json()) as Promise<IConnectDotsResponse>;
}