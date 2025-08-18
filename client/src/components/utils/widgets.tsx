import {useWidgetsContext} from "@/contexts/widgets.ts";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button.tsx";
import {Dot, XIcon} from "lucide-react";
import {useEffect, useState} from "react";
import type {IConnectDotsResponse, ISemanticSearchResult} from "@/types";
import {APIConnectDots} from "@/apis/helper.ts";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {FaFilePdf} from "react-icons/fa";
import {Progress} from "@/components/ui/progress.tsx";
import {useAppContext} from "@/contexts/app.ts";
import {APP_CONFIG} from "@/constants/app.ts";

const AppWidgets = () => {
    const {tabs, updateTab, addTab, setActiveTab} = useAppContext();
    const {connectDotsOpen, setConnectDotsOpen, connectDotsSessionData} = useWidgetsContext();
    const [results, setResults] = useState({} as IConnectDotsResponse);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        if (connectDotsSessionData.selectedText) {
            setLoading(true);
            setErrors([]);
            APIConnectDots(
                connectDotsSessionData.selectedText,
                connectDotsSessionData.context,
                5
            )
                .then(response => {
                    setResults(response)
                })
                .catch(err => {
                    console.error("Error connecting dots:", err);
                    setErrors([err.message || "An error occurred while connecting dots."]);
                })
                .finally(() => {
                    setLoading(false);
                })
        }
    }, [connectDotsSessionData.context, connectDotsSessionData.selectedText]);

    const openDocument = (document: { filename: string; id: string }, result: ISemanticSearchResult) => {
        // check if the document is already loaded in tabs and get the info of the existing tab and its index in tabs array (which is not the tab.id)
        const existingTab = tabs.find(tab => tab.id === document.id);
        if (existingTab) {
            // get the index of the existing tab
            const existingTabIndex = tabs.findIndex(tab => tab.id === document.id);
            console.log(existingTabIndex, existingTab);
            setActiveTab(existingTabIndex);
            updateTab(existingTabIndex, {
                ...existingTab,
                info: result,
            })
        } else {
            addTab({
                url: `${APP_CONFIG.BACKEND_URL}/documents/${document.id}/pdf`,
                title: document.filename,
                id: document.id,
                fileName: document.filename,
                info: result
            })
        }
    }
    return (
        <div className="fixed bottom-0 left-4 z-50">
            <AnimatePresence>
                {connectDotsOpen && (
                    <motion.div
                        initial={{y: "100%", opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        exit={{y: "100%", opacity: 0}}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            duration: 0.3
                        }}
                        className="bg-white dark:bg-black shadow-lg rounded-t-lg border-primary p-4 w-80 h-[90dvh] border"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Connect Dots</h3>
                            <Button
                                onClick={() => setConnectDotsOpen(false)}
                                className="rounded-full"
                                size={'icon'}
                                variant={'ghost'}
                            >
                                <XIcon/>
                            </Button>
                        </div>
                        <div className="flex-1 h-full">
                            {loading ? (
                                <>
                                    {
                                        [...Array(10).keys()].map((_, index) => <button
                                            key={index}
                                            className={'relative w-full border-b border-dashed last:border-none flex items-start gap-2 p-2 pointer-events-none'}>
                                            <div>
                                                <Skeleton className="size-8"/>
                                            </div>
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
                            ) : (
                                results?.results && results.results.length > 0 ? (
                                    <>
                                        <h1 className={'text-sm w-full truncate'}>
                                            Showing results for <span
                                            className={'font-semibold '}>"{results.query}"</span>
                                            &nbsp;<i className={'text-sm'}>({results.processing_time}s)</i>
                                        </h1>
                                        <hr className={'my-3'}/>
                                        <div className={'overflow-y-scroll pb-28 h-full'}>
                                            {results.results.map((result, idx) => {
                                                // convert the 0-1 relevance score to a percentage
                                                const relevanceScore = Math.round(result.relevance_score * 100);
                                                return (<button
                                                    key={idx}
                                                    onClick={() => openDocument({
                                                        filename: result.document_filename,
                                                        id: result.document_id
                                                    }, result)}
                                                    onAuxClick={() => openDocument({
                                                        filename: result.document_filename,
                                                        id: result.document_id
                                                    }, result)}
                                                    className={'relative w-full border-b border-dashed last:border-none flex items-start gap-2 p-2 dark:hover:bg-[#18181b] hover:bg-[#f4f4f5] rounded-md cursor-pointer'}>
                                                    <div className={'grid grid-cols-12 items-start gap-2'}>
                                                        <FaFilePdf className={'size-8 col-span-2 text-[#e5252a]'}/>
                                                        <div className={'grid gap-1 text-start col-span-10'}>
                                                            <h1
                                                                className={'truncate'}
                                                                title={`${result.document_filename} (Page ${result.page_number + 1})`}
                                                            >{result.document_filename} (Page {result.page_number + 1})</h1>
                                                            <h3 className={'text-sm text-muted-foreground'}>
                                                                <b>Section: </b> {result.section_title}
                                                            </h3>
                                                            <div className={'text-xs flex-col w-full'}>
                                                                <div
                                                                    className={'flex items-center justify-between pb-0.5'}>
                                                                    <h4>Relevance:</h4>
                                                                    <span
                                                                        className={'text-primary'}>{relevanceScore}%</span>
                                                                </div>
                                                                <Progress value={relevanceScore}/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>);
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        {errors.length > 0 ? (
                                            <div className="text-red-500">
                                                <p>Error occurred:</p>
                                                {errors.map((error, idx) => (
                                                    <p key={idx} className="text-sm">{error}</p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>No results found.</p>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppWidgets;

