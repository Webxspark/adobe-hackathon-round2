import {cn} from "@/lib/utils.ts";
import {useAppContext} from "@/contexts/app.ts";
import {useCallback, useEffect, useRef, useState} from "react";
import {LinearProgress} from "@mui/material";
import {APIFetchSingleDocument} from "@/apis/helper.ts";
import {toast} from "sonner";
import type {IDocumentSection, ISemanticSearchResult} from "@/types";
import {useWidgetsContext} from "@/contexts/widgets.ts";

interface IPdfReaderPageProps {
    className?: string;
}

interface IPdfRenderComponentProps {
    url: string;
    pid: string;
    uid: number;
    fileName?: string;
    className: string;
    info?: ISemanticSearchResult | undefined;
}

const PdfRender = ({url, className, pid, uid, fileName, info}: IPdfRenderComponentProps) => {
    const isMounted = useRef(false);
    const [loading, setLoading] = useState(false);
    const {singleDocuments, setSingleDocument, pdfEmbedAPI} = useAppContext();
    const singleDocumentsRef = useRef(singleDocuments);
    const div_id = Date.now() + uid; // Unique ID for the div element
    const {
        setConnectDotsOpen,
        setConnectDotsSessionData,
        setShowOptions,
        setShowOptionsSessionData
    } = useWidgetsContext();

    // Keep ref updated with current singleDocuments
    useEffect(() => {
        singleDocumentsRef.current = singleDocuments;
    }, [singleDocuments]);

    const fetchSingleDocument = useCallback(() => {
        setLoading(true);
        console.info("Loading single document INFO");
        APIFetchSingleDocument(pid)
            .then(response => {
                console.info("Single document INFO loaded: ", response);
                setSingleDocument(pid, response)
            })
            .catch(error => {
                console.error("Error fetching single document:", error);
                toast.error("Failed to fetch document details.");
            })
            .finally(() => setLoading(false));
    }, [pid, setSingleDocument])


    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            let adobeDCView = new AdobeDC.View({
                clientId: pdfEmbedAPI,
                divId: `${div_id}-${pid}`,
            })
            let previewFilePromise = adobeDCView.previewFile({
                content: {
                    location: {
                        url
                    }
                },
                metaData: {
                    fileName,
                }
            });

            if (!singleDocuments[pid]) {
                fetchSingleDocument();
            }

            const eventOptions = {

                //Pass the events to receive.

                //If no event is passed in listenOn, then all file preview events will be received.

                listenOn: [AdobeDC.View.Enum.Events.APP_RENDERING_START, AdobeDC.View.Enum.FilePreviewEvents.PREVIEW_KEY_DOWN, AdobeDC.View.Enum.FilePreviewEvents.PREVIEW_PAGE_VIEW_SCROLLED, AdobeDC.View.Enum.FilePreviewEvents.PREVIEW_SELECTION_END],

                enableFilePreviewEvents: true

            }


            adobeDCView.registerCallback(
                AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,

                function (event) {

                    if (event.type === "PREVIEW_SELECTION_END") {

                        previewFilePromise.then(adobeViewer => {
                            adobeViewer.getAPIs().then(apis => {
                                apis.getSelectedContent()
                                    .then(result => {
                                        const selectedText = result.data;
                                        previewFilePromise.then(adobeViewer => {
                                            adobeViewer.getAPIs().then(apis => {
                                                apis.getCurrentPage()
                                                    .then((result: number) => {
                                                        const currentPageNumber = (result as number) - 1;
                                                        const docInfo = singleDocumentsRef.current[pid];
                                                        if (docInfo) {
                                                            const relevantSections: IDocumentSection[] = [];
                                                            // get sections from the docInfo.sections and append to relevantSections where page_number is equal to currentPageNumber
                                                            docInfo.sections.forEach(section => {
                                                                if (section.page_number === currentPageNumber) {
                                                                    relevantSections.push(section);
                                                                }
                                                            });
                                                            // concatenate the snippets of the relevant sections into a single string
                                                            const contextText: string = relevantSections.map(section => section.snippet).join(" ");
                                                            console.log("Selected text: ", selectedText);
                                                            console.log("Context text: ", contextText);
                                                            setConnectDotsOpen(true);
                                                            setConnectDotsSessionData({
                                                                selectedText,
                                                                context: contextText,
                                                                filename: docInfo.document.original_filename
                                                            });
                                                            setShowOptions(true);
                                                            setShowOptionsSessionData(singleDocumentsRef.current[pid]!.sections, currentPageNumber);
                                                        } else {
                                                            console.log("Document info not yet loaded");
                                                        }
                                                    })
                                                    .catch((error: string) => console.error(error));
                                            });
                                        });
                                    })
                                    .catch((error: string) => console.error(error));
                            });
                        });
                    }

                }, eventOptions
            );


            if (info !== undefined) {
                previewFilePromise.then(yaarudaivan => {
                    yaarudaivan.getAPIs().then((apis) => {
                        apis.gotoLocation(info.page_number + 1, 10, 100)
                            .then((resp) => console.info("gotoLocation complete: ", resp))
                            .catch(err => console.error("gotoLocation error: ", err))
                    })
                })
            }
        }
    }, [div_id, fetchSingleDocument, fileName, info, pid, setConnectDotsOpen, setConnectDotsSessionData, singleDocuments, url]);
    return (
        <div className={cn('h-[95dvh] relative', className)}>
            {loading && <div className={'absolute top-0 left-0 w-full'}>
                <LinearProgress/>
            </div>}
            <div
                id={`${div_id}-${pid}`}
            />
        </div>
    )
}


const PdfReaderWrapper = ({className}: IPdfReaderPageProps) => {
    const {tabs, activeTab} = useAppContext();
    return (
        <div className={cn(className)}>
            {
                tabs.map((tab, idx) => (
                    <PdfRender
                        url={tab.url}
                        key={idx}
                        pid={tab.id}
                        uid={idx}
                        fileName={tab.fileName!}
                        info={tab.info}
                        className={cn("hidden", activeTab === idx && "block")}
                    />
                ))
            }
        </div>
    );
};

export default PdfReaderWrapper;