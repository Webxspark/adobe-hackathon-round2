import {cn} from "@/lib/utils.ts";
import {useAppContext} from "@/contexts/app.ts";
import {useCallback, useEffect, useRef, useState} from "react";
import {APP_CONFIG} from "@/constants/app.ts";
import {LinearProgress} from "@mui/material";
import {APIFetchSingleDocument} from "@/apis/helper.ts";
import {toast} from "sonner";

interface IPdfReaderPageProps {
    className?: string;
}

interface IPdfRenderComponentProps {
    url: string;
    pid: string;
    uid: number;
    fileName?: string;
    className: string;
}

const PdfRender = ({url, className, pid, uid, fileName}: IPdfRenderComponentProps) => {
    const isMounted = useRef(false);
    const [loading, setLoading] = useState(false);
    const {singleDocuments, setSingleDocument} = useAppContext();
    const div_id = Date.now() + uid; // Unique ID for the div element

    const fetchSingleDocument = useCallback(() => {
        setLoading(true);
        APIFetchSingleDocument(pid)
            .then(response => {
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
                clientId: APP_CONFIG.EMBED_API_CLIENT_ID,
                divId: `${div_id}-${pid}`,
            })
            adobeDCView.previewFile({
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
        }
    }, [div_id, fetchSingleDocument, fileName, pid, singleDocuments, url]);
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
                        className={cn("hidden", activeTab === idx && "block")}
                    />
                ))
            }
        </div>
    );
};

export default PdfReaderWrapper;