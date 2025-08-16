import {cn} from "@/lib/utils.ts";
import {useAppContext} from "@/contexts/app.ts";
import {useEffect, useRef} from "react";
import {APP_CONFIG} from "@/constants/app.ts";

interface IPdfReaderPageProps {
    className?: string;
}

interface IPdfRenderComponentProps {
    url: string;
    pid: number;
    className: string;
}

const PdfRender = ({url, className, pid}:IPdfRenderComponentProps) => {
    const isMounted = useRef(false);
    const div_id = Date.now();
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            let adobeDCView = new AdobeDC.View({
                clientId: APP_CONFIG.EMBED_API_CLIENT_ID,
                divId: `adc-${div_id}-${pid}`,
            })
            adobeDCView.previewFile({
                content: {
                    location: {
                        url
                    }
                },
                metaData: {
                    fileName: `FileName - ${div_id}`,
                }
            });
        }
    }, [div_id, pid, url]);
    return(
        <div
            className={cn('h-[95dvh]', className)}
            id={`adc-${div_id}-${pid}`}
        />
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
                        pid={idx}
                        className={cn("hidden", activeTab === idx && "block")}
                    />
                ))
            }
        </div>
    );
};

export default PdfReaderWrapper;