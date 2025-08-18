import {Button} from "@/components/ui/button.tsx";
import {Grip} from "lucide-react";
import {useAppContext} from "@/contexts/app.ts";
import {cn} from "@/lib/utils.ts";
import Navbar from "@/components/navbar.tsx";
import FilePicker from "@/views/file-picker.tsx";
import Preloader from "@/components/preloader.tsx";
import {Suspense, useEffect, useRef, useState, lazy} from "react";
import Keybinds from "@/components/utils/keybinds.tsx";

const PdfReaderWrapper = lazy(() => import("@/views/pdf-reader-wrapper.tsx"));
const AppWidgets = lazy(() => import("@/components/utils/widgets.tsx"));
const App = () => {
    const {activeTab, setActiveTab} = useAppContext();
    const [loadPDFReaderWrapper, setLoadPDFReaderWrapper] = useState<boolean>(false);
    const isPDFReaderWrapperLoaded = useRef(false);

    useEffect(() => {
        if (activeTab !== null && !isPDFReaderWrapperLoaded.current) {
            isPDFReaderWrapperLoaded.current = true;
            setLoadPDFReaderWrapper(true);
        }
    }, [activeTab]);
    return (
        <div className={'min-h-screen dark:bg-[#18181b] bg-[#f4f4f5]'}>
            <div className={'dark:bg-[#09090b] bg-white flex items-center'}>
                <Button
                    variant={'ghost'}
                    onClick={() => setActiveTab(null)}
                    className={cn('rounded-none p-3  border-t-2 border-transparent', activeTab === null && "dark:bg-[#18181b] bg-[#f4f4f5] border-primary")}
                >
                    <Grip className={'size-6 dark:text-white'}/>
                </Button>
                <Navbar/>
            </div>
            <FilePicker
                className={cn("hidden", activeTab === null && "grid")}
            />
            {
                loadPDFReaderWrapper && <Suspense
                    fallback={<Preloader className={'h-[80dvh] flex items-center justify-center'}/>}
                >
                    <PdfReaderWrapper/>
                </Suspense>
            }

            <Suspense fallback={null}><AppWidgets/></Suspense>
            <Keybinds/>
        </div>
    );
};

export default App;