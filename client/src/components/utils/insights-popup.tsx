import {useWidgetsContext} from "@/contexts/widgets.ts";
import {AnimatePresence, motion} from "framer-motion";
import {Button} from "@/components/ui/button.tsx";
import {XIcon} from "lucide-react";
import Markdown from "react-markdown";

const WidgetInsightsPopup = () => {
    const {insightsSessionData, insightsOpen, setInsightsOpen} = useWidgetsContext();
    return (
        <div>
            <div className="fixed bottom-0 left-4 z-50">
                <AnimatePresence>
                    {
                        insightsOpen && (
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
                                    <h3 className="text-lg font-semibold">Insights <span className={'text-sm uppercase'}>({insightsSessionData.insight_type})</span></h3>
                                    <Button
                                        onClick={() => setInsightsOpen(false)}
                                        className="rounded-full"
                                        size={'icon'}
                                        variant={'ghost'}
                                    >
                                        <XIcon/>
                                    </Button>
                                </div>
                                <div className="flex-1 h-full overflow-y-auto no-tailwindcss pb-20">
                                    <Markdown
                                        children={insightsSessionData.insights.replace(/\\n/g, "\n")}
                                    >
                                    </Markdown>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WidgetInsightsPopup;