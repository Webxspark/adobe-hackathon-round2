import {LoaderCircle} from "lucide-react";
import {cn} from "@/lib/utils.ts";

interface IPreloaderProps {
    className?: string;
}

const Preloader = ({className}: IPreloaderProps) => {
    return (
        <div className={cn(className)}>
            <LoaderCircle className={'text-xl animate-spin'}/>
        </div>
    );
};

export default Preloader;