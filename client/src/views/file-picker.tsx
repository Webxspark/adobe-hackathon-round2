import {cn} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {useAppContext} from "@/contexts/app.ts";
import {Card, CardContent, CardHeader, CardHeading, CardTitle, CardToolbar} from "@/components/ui/card.tsx";
import {ArrowRight, Dot, Frown, RotateCw, Search, XIcon} from "lucide-react";
import {Input, InputWrapper} from "@/components/ui/input.tsx";
import {lazy, Suspense, useCallback, useEffect, useRef, useState} from "react";
import {FcFolder} from "react-icons/fc";
import {APIFetchAllDocuments} from "@/apis/helper.ts";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge.tsx";
import dayjs from 'dayjs'
import {Skeleton} from "@/components/ui/skeleton.tsx";
import type {IAllDocumentInfo} from "@/types";
import {APP_CONFIG} from "@/constants/app.ts";
import {FaFilePdf} from "react-icons/fa";

const FileUploadCompact = lazy(() => import("@/components/file-upload/compact-upload.tsx"));

interface IFilePickerProps {
    className?: string,
}

const FilePicker = ({className}: IFilePickerProps) => {
    const {addTab, documents, setDocuments, setDocumentRefresh, documentRefresh, tabs, setActiveTab, removeTab} = useAppContext();
    const searchBarRef = useRef<HTMLInputElement | null>(null);
    const isMounted = useRef(false);
    const [loading, setLoading] = useState<boolean>(false);

    const loadDocuments = useCallback(() => {
        setLoading(true);
        APIFetchAllDocuments().then(docs => {
            setDocuments(docs);
        }).catch((err) => {
            console.error(err)
            toast.error("Oops, something went wrong while fetching documents.");
        }).finally(() => {
            setLoading(false);
        })
    }, [setDocuments])

    useEffect(() => {
        if (documentRefresh) {
            loadDocuments();
            setDocumentRefresh(false);
        }
    }, [documentRefresh, loadDocuments, setDocumentRefresh]);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            loadDocuments();
        }
    }, [loadDocuments, setDocuments]);

    const openDocument = (doc: IAllDocumentInfo) => {
        addTab({
            url: `${APP_CONFIG.BACKEND_URL}/documents/${doc.id}/pdf`,
            title: doc.original_filename,
            id: doc.id,
            fileName: doc.original_filename,
        });
    }

    return (
        <div className={cn('grid grid-cols-12 gap-12 m-6', className)}>
            <div className="col-span-8">
                <Card>
                    <CardHeader>
                        <CardHeading>
                            <CardTitle className={'flex items-center gap-1'}>
                                <FcFolder className={'size-5'}/> My Library
                            </CardTitle>
                        </CardHeading>
                        <CardToolbar>
                            <Button onClick={loadDocuments} size={'icon'} variant={'ghost'} mode={'icon'}>
                                <RotateCw/>
                            </Button>
                            <InputWrapper variant={'md'} className={cn(loading && "animate-pulse")}>
                                <Search
                                    onClick={() => searchBarRef.current?.focus()}
                                />
                                <Input
                                    placeholder="Search..."
                                    ref={searchBarRef}
                                    variant={'md'}
                                    disabled={loading}
                                />
                                <Button
                                    disabled={loading}
                                    size="sm" variant="dim" mode="icon" className="size-5 -me-0.5">
                                    <ArrowRight/>
                                </Button>
                            </InputWrapper>
                        </CardToolbar>
                    </CardHeader>
                    <CardContent className={'py-4 max-h-[84dvh] overflow-y-auto'}>
                        {loading && <>
                                {
                                    [...Array(10).keys()].map(() => <button
                                        className={'relative w-full border-b border-dashed last:border-none flex items-start gap-2 p-2 pointer-events-none'}>
                                        <div>
                                            <Skeleton className="size-8"/>
                                        </div>
                                        <Skeleton className={'absolute top-2 z-10 right-2 h-6 w-24'}/>
                                        <div className={'grid gap-3'}>
                                            <div>
                                                <Skeleton className={'h-5 w-56'}/>
                                                <div
                                                    className={'flex items-center'}>
                                                    <Skeleton className={'h-4 w-24'}/>
                                                    <Dot className={'animate-pulse text-muted-foreground'}/>
                                                    <Skeleton className={'h-4 w-24'}/>
                                                </div>
                                            </div>
                                        </div>
                                    </button>)
                                }
                            </>
                            || <>
                                {
                                    documents.map((doc, idx) => (
                                        <button key={idx}
                                                onClick={() => openDocument(doc)}
                                                onAuxClick={() => openDocument(doc)}
                                                className={'relative w-full border-b border-dashed last:border-none flex items-start gap-2 p-2 dark:hover:bg-[#18181b] hover:bg-[#f4f4f5] rounded-md cursor-pointer'}>
                                            <div>
                                                <FaFilePdf
                                                    className={'size-8 text-[#e5252a]'}
                                                />
                                            </div>
                                            <Badge
                                                variant={'secondary'}
                                                className={'absolute top-2 z-10 right-2'}
                                            >
                                                {doc.total_sections} Section(s)
                                            </Badge>
                                            <div className={'grid gap-3'}>
                                                <div>
                                                    <h1 className={'font-semibold'}>{doc.original_filename}</h1>
                                                    <span
                                                        className={'text-sm flex items-center'}>{dayjs(doc.upload_time).format("DD/MM/YYYY")}
                                                        <Dot/> {dayjs(doc.upload_time).format('hh:mm A')}</span>
                                                </div>
                                            </div>
                                        </button>)
                                    )
                                }
                                {
                                    documents.length === 0 && !loading && (
                                        <div
                                            className={'text-muted-foreground flex items-center flex-col gap-2 justify-center h-[78dvh]'}>
                                            <Frown className={'size-20'}/>
                                            <p>Upload your first document to get started.</p>
                                        </div>
                                    )
                                }
                            </>
                        }
                    </CardContent>
                </Card>
            </div>
            <div className="col-span-4">
                <Suspense
                    fallback={<div className={'p-4 px-10 border rounded-md border-dashed flex items-center gap-2'}>
                        <Skeleton className={'w-24 h-7 bg-[#27272a]'}/>
                        <Skeleton className={'w-96 h-5 bg-[#27272a]'}/>
                    </div>}
                >
                    <FileUploadCompact
                        maxFiles={100}
                        maxSize={100 * 1024 * 1024}
                        accept={'application/pdf'}
                        multiple={true}
                    />
                </Suspense>

                <div className={'my-4'}>
                    <Card>
                        <CardHeader>
                            <CardHeading>
                                <CardTitle className={'flex items-center gap-1'}>
                                    Open Tabs
                                </CardTitle>
                            </CardHeading>
                        </CardHeader>
                        <CardContent className={'py-4'}>
                            {tabs.length === 0 && (
                                <div
                                    className={'text-muted-foreground flex items-center flex-col gap-2 justify-center min-h-[30dvh]'}>
                                    <Frown className={'size-20'}/>
                                    <p>No tabs open. Click on a document to open it.</p>
                                </div>
                            ) || (<>
                                    {
                                        tabs.map((tab, idx) => (
                                            <button
                                                className={'w-full flex items-center gap-2 p-2 hover:bg-[#f4f4f5] dark:hover:bg-[#18181b] rounded-md'}
                                                key={idx}
                                                onClick={() => setActiveTab(idx)}
                                            >
                                                <FaFilePdf className={'size-6 text-[#e5252a]'}/>
                                                <span className={'text-sm truncate max-w-[200px]'}>{tab.title}</span>
                                                <div
                                                    className={'p-1 cursor-pointer ml-auto'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTab(idx);
                                                    }}
                                                >
                                                    <XIcon className={'size-4 ml-auto'}/>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FilePicker;