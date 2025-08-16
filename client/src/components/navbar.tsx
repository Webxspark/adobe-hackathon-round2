import {FileText, X} from "lucide-react";
import {useAppContext} from "@/contexts/app.ts";
import {cn} from "@/lib/utils.ts";

const Navbar = () => {
    const {activeTab, tabs, removeTab, setActiveTab} = useAppContext();
    return (
        <div className={'overflow-x-scroll flex items-center'}>
            {tabs.length === 0 && <div className={'text-sm ml-2'}>
                    Team: O(1+1)
                </div>
                || tabs.map((tab, index) => (
                    <button onClick={() => setActiveTab(index)} key={index}
                            className={cn('flex items-center gap-x-3 h-full border-t-2 border-transparent', activeTab === index && "border-primary")}>
                        <div
                            className={cn('flex items-center h-[33px] justify-between min-w-36 gap-1 border-r px-3 pr-2 dark:hover:bg-gray-900 hover:bg-gray-100 duration-100', activeTab === index && "dark:bg-[#18181b] bg-[bg-[#f4f4f5]")}
                        >
                            <div className={'flex items-center gap-2'}>
                                <FileText className={'size-4'}/>
                                <p className={'text-sm truncate max-w-36'}>
                                    {tab.title}
                                </p>
                            </div>
                            <span
                                onClick={(e) => {
                                    e.stopPropagation(); // stop button onClick()
                                    removeTab(index);
                                }}
                                className={'p-1 cursor-pointer dark:hover:bg-gray-800 hover:bg-gray-50 rounded-full duration-100'}
                            >
                                <X className={'size-4'}/>
                            </span>
                        </div>
                    </button>))
            }
        </div>
    );
};

export default Navbar;