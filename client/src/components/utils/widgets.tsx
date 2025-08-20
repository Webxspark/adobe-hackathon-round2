import {useWidgetsContext} from "@/contexts/widgets.ts";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button.tsx";
import {AudioLines, Dot, Lightbulb, XIcon} from "lucide-react";
import {type FormEvent, useEffect, useState} from "react";
import type {IConnectDotsResponse, ISemanticSearchResult} from "@/types";
import {APIConnectDots, APIGenerateAudio, APIGenerateInsights} from "@/apis/helper.ts";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {FaFilePdf} from "react-icons/fa";
import {Progress} from "@/components/ui/progress.tsx";
import {useAppContext} from "@/contexts/app.ts";
import {APP_CONFIG} from "@/constants/app.ts";
import {toast} from "sonner";
import {Label} from "@/components/ui/label.tsx";
import {cn} from "@/lib/utils.ts";
import Preloader from "@/components/preloader.tsx";
import WidgetInsightsPopup from "@/components/utils/insights-popup.tsx";
import WidgetAudioPlayer from "@/components/utils/audio-player.tsx";

const AppWidgets = () => {
    const {tabs, updateTab, addTab, setActiveTab} = useAppContext();
    const {
        connectDotsOpen,
        setConnectDotsOpen,
        connectDotsSessionData,

        showOptions,
        setShowOptions,
        showOptionsSessionData,

        setInsightsOpen,
        setInsightsSessionData,

        setAudioPlayerOpen,
        setAudioPlayerSessionData
    } = useWidgetsContext();
    const [results, setResults] = useState({} as IConnectDotsResponse);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [insightsTypeSelectionOpen, setInsightsTypeSelectionOpen] = useState<boolean>(false);
    const [audioOverviewTypeSelectionOpen, setAudioOverviewTypeSelectionOpen] = useState<boolean>(false);
    const [insightsTypeSelection, setInsightsTypeSelection] = useState<string | null>('comprehensive');
    const [audioOverviewTypeSelection, setAudioOverviewTypeSelection] = useState<string | null>('overview');
    const [optionsButtonLoading, setOptionsButtonLoading] = useState<boolean>(false);
    useEffect(() => {
        // set event listener on body tag to close the options when clicked outside
        const handleClickOutside = (event: MouseEvent) => {
            if (showOptions) {
                const target = event.target as HTMLElement;
                // Check if the click is outside the show options buttons
                if (!target.closest('.show-options-button') && !target.closest('.connect-dots-button')) {
                    setShowOptions(false);
                }
            }
        }
        document.body.addEventListener('click', handleClickOutside);
        return () => {
            document.body.removeEventListener('click', handleClickOutside);
        }
    }, [connectDotsOpen, setConnectDotsOpen, setShowOptions, showOptions]);
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

    const handleInsightsGenerationFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!insightsTypeSelection) {
            toast.error("Please select an insights type to generate.");
            return;
        }
        // // setOptionsButtonLoading(true);
        const sections: string[] = [];
        // get ids of sections from showOptionsSessionData ranging from current page number -1 -> current page number + 1
        const currentPageNumber = showOptionsSessionData.page_number;
        showOptionsSessionData.sections.forEach(section => {
            if (section.page_number >= currentPageNumber - 1 && section.page_number <= currentPageNumber + 1) {
                sections.push(section.id);
            }
        })
        console.log(sections);
        setOptionsButtonLoading(true);
        APIGenerateInsights(connectDotsSessionData.selectedText, insightsTypeSelection, sections)
            .then(response => {
                setInsightsSessionData(response)
                setInsightsOpen(true)
            })
            .catch(err => {
                console.error("Error generating insights:", err);
                toast.error("Failed to generate insights. Please try again.");
            })
            .finally(() => {
                setOptionsButtonLoading(false);
            })

    }
    const handleAudioGenerationFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!audioOverviewTypeSelection) {
            toast.error("Please select an audio overview type to generate.");
            return;
        }
        // setOptionsButtonLoading(true);
        const sections: string[] = [];
        // get ids of sections from showOptionsSessionData ranging from current page number -1 -> current page number + 1
        const currentPageNumber = showOptionsSessionData.page_number;
        showOptionsSessionData.sections.forEach(section => {
            if (section.page_number >= currentPageNumber - 1 && section.page_number <= currentPageNumber + 1) {
                sections.push(section.id);
            }
        })

        if(sections.length === 0){
            toast.error("No sections found for the current page. Please select a different page or ensure sections are available.");
            return;
        }

        console.log(sections);
        setOptionsButtonLoading(true);
        APIGenerateAudio(connectDotsSessionData.selectedText, sections, audioOverviewTypeSelection)
            .then(response => {
                if(response.success){
                    setAudioPlayerOpen(true);
                    setAudioPlayerSessionData({
                        audioUrl: `${APP_CONFIG.BACKEND_URL}${response.audio_file}`,
                        title: `${connectDotsSessionData.filename} - Audio ${audioOverviewTypeSelection}`
                    });
                }
            })
            .catch(err => {
                console.error("Error generating audio overview:", err);
                toast.error("Failed to generate audio overview. Please try again.");
            })
            .finally(() => {
                setOptionsButtonLoading(false);
            })
    }
    const openDocument = (document: { filename: string; id: string }, result: ISemanticSearchResult) => {
        // const existingTab = tabs.find(tab => tab.id === document.id);
        // if (existingTab) {
        //     // get the index of the existing tab
        //     const existingTabIndex = tabs.findIndex(tab => tab.id === document.id);
        //     console.log(existingTabIndex, existingTab);
        //     setActiveTab(existingTabIndex);
        //     updateTab(existingTabIndex, {
        //         ...existingTab,
        //         info: result,
        //     })
        // } else {
        // }
            addTab({
                url: `${APP_CONFIG.BACKEND_URL}/documents/${document.id}/pdf`,
                title: document.filename,
                id: document.id,
                fileName: document.filename,
                info: result
            })
    }

    const copyTextToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                toast.success("Query copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy text to clipboard:", err);
            });
    }
    return (
        <div>
            <div className="fixed bottom-0 left-4 z-40">
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
                                            <h1 onClick={() => copyTextToClipboard(results.query)}
                                                className={'text-sm w-full truncate cursor-pointer'}>
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
            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{x: "100%", opacity: 0}}
                        animate={{x: 0, opacity: 1}}
                        exit={{x: "100%", opacity: 0}}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            duration: 0.2
                        }}
                        layout
                        className={'absolute w-80 z-50 right-0 top-1/2 -translate-y-1/2'}
                    >
                        <motion.div
                            layout
                            className={'bg-white dark:bg-black shadow-lg rounded-l-lg border-primary p-4 border show-options-button'}>
                            <div className="flex items-center  justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setAudioOverviewTypeSelectionOpen(false)
                                        setInsightsTypeSelectionOpen(!insightsTypeSelectionOpen);
                                    }}
                                    className={
                                        cn('cursor-pointer hover:bg-gray-200 border border-transparent dark:hover:bg-gray-800 duration-200 transition-colors flex-col p-6 dark:bg-[#27272a] bg-gray-100 rounded-lg items-center justify-center flex text-base',
                                            insightsTypeSelectionOpen && 'border-white'
                                        )
                                    }>
                                    <Lightbulb className={'size-6'}/> Generate Insights
                                </button>
                                <button
                                    onClick={() => {
                                        setInsightsTypeSelectionOpen(false)
                                        setAudioOverviewTypeSelectionOpen(!audioOverviewTypeSelectionOpen);
                                    }}
                                    className={
                                        cn('cursor-pointer hover:bg-gray-200 border border-transparent dark:hover:bg-gray-800 duration-200 transition-colors flex-col p-6 dark:bg-[#27272a] bg-gray-100 rounded-lg items-center justify-center flex text-base',
                                            audioOverviewTypeSelectionOpen && 'border-white'
                                        )
                                    }>
                                    <AudioLines className={'size-6'}/> Audio Overview
                                </button>
                            </div>
                            <AnimatePresence mode={'wait'}>
                                {insightsTypeSelectionOpen && <motion.div
                                    key="insights" // Add unique key
                                    className={'my-3'}
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: "auto", opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    transition={{
                                        type: "spring",
                                        damping: 25,
                                        stiffness: 300,
                                        duration: 0.3
                                    }}
                                    style={{overflow: "hidden"}} // Prevent content from showing during animation
                                >
                                    <form onSubmit={handleInsightsGenerationFormSubmit}>
                                        <Label>
                                            Select a type of insights to generate:
                                        </Label>
                                        <div className={'grid grid-cols-2 gap-4 flex-wrap my-3'}>
                                            {
                                                APP_CONFIG.INSIGHTS_GENERATION_TYPES.map((insightType, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={
                                                            cn("p-4 rounded-md flex capitalize w-full items-center cursor-pointer justify-center border-1 border-gray-700 hover:border-gray-400 duration-75",
                                                                insightsTypeSelection === insightType && "dark:border-white shadow-lg dark:hover:border-white border-gray-800 hover:shadow-md")
                                                        }
                                                        onClick={() => setInsightsTypeSelection(insightType)}
                                                    >
                                                        {insightType}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div className={'mt-3'}>
                                            <Button className={'w-full'} disabled={optionsButtonLoading}>
                                                {optionsButtonLoading ? <Preloader/> : <Lightbulb/>} Generate
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>}
                                {audioOverviewTypeSelectionOpen && <motion.div
                                    key="insights" // Add unique key
                                    className={'my-3'}
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: "auto", opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    transition={{
                                        type: "spring",
                                        damping: 25,
                                        stiffness: 300,
                                        duration: 0.3
                                    }}
                                    style={{overflow: "hidden"}} // Prevent content from showing during animation
                                >
                                    <form onSubmit={handleAudioGenerationFormSubmit}>
                                        <Label>
                                            Select a type of audio overview to generate:
                                        </Label>
                                        <div className={'grid grid-cols-2 gap-4 flex-wrap my-3'}>
                                            {
                                                APP_CONFIG.AUDIO_OVERVIEW_TYPES.map((insightType, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={
                                                            cn("p-4 rounded-md flex capitalize w-full items-center cursor-pointer justify-center border-1 border-gray-700 hover:border-gray-400 duration-75",
                                                                audioOverviewTypeSelection === insightType && "dark:border-white shadow-lg dark:hover:border-white border-gray-800 hover:shadow-md")
                                                        }
                                                        onClick={() => setAudioOverviewTypeSelection(insightType)}
                                                    >
                                                        {insightType}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div className={'mt-3'}>
                                            <Button className={'w-full'} disabled={optionsButtonLoading}>
                                                {optionsButtonLoading ? <Preloader/> : <AudioLines/>} Generate
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <WidgetInsightsPopup />
            <WidgetAudioPlayer />
        </div>
    );
};

export default AppWidgets;

