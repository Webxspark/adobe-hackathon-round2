import {AnimatePresence, motion} from "framer-motion";
import {useWidgetsContext} from "@/contexts/widgets.ts";
import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {DownloadIcon, XIcon} from "lucide-react";
import AudioPlayer from "react-h5-audio-player";
import 'react-h5-audio-player/lib/styles.css';
import {Label} from "@/components/ui/label.tsx";

const WidgetAudioPlayer = () => {
    const {
        audioPlayerOpen,
        audioPlayerSessionData,
        setAudioPlayerOpen,
    } = useWidgetsContext();
    return (
        <div>
            <div className="fixed lg:w-1/4 md:w-1/2 m-auto inset-x-0 bottom-0 z-50">
                <AnimatePresence>
                    {
                        audioPlayerOpen && (
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
                            >
                                <div className='bg-white drop-shadow-2xl rounded-t-3xl'>
                                    <div className='relative w-full'>
                                        <div className='absolute -top-10 right-2'>
                                            <Button onClick={() => {
                                                setAudioPlayerOpen(false)
                                            }} size="icon"
                                                    className="rounded-full">
                                                <XIcon className='h-4 w-4'/>
                                            </Button>
                                        </div>
                                    </div>
                                    <AudioPlayer
                                        autoPlay={true}
                                        showJumpControls={false}
                                        src={audioPlayerSessionData.audioUrl}
                                        className='rounded-t-3xl'
                                        // other props here
                                    >
                                        hi
                                    </AudioPlayer>
                                    <div className={'p-2 w-full truncate text-black'}>
                                        <Label className={'text-black'}>
                                            {audioPlayerSessionData.title}
                                        </Label>
                                        <div className={'flex items-center justify-end'}>
                                            <a className={
                                                buttonVariants({
                                                    size: 'sm',
                                                    variant: 'secondary'
                                                })
                                            }
                                               href={audioPlayerSessionData.audioUrl}
                                               download
                                               target={'_blank'}
                                            >
                                                <DownloadIcon/> Download
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WidgetAudioPlayer;