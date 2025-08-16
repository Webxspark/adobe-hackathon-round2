import {cn} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {useAppContext} from "@/contexts/app.ts";

interface IFilePickerProps {
    className?: string,
}
const FilePicker = ({className}: IFilePickerProps) => {
    const {addTab} = useAppContext();

    const addMockTab = (idx: number) => {
        const arr = [
             {
                title: "PDF 1",
                url: "https://alan.webxspark.com/resume.pdf"
            },
            {
                title: "PDF 2",
                url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf"
            }
        ]
        addTab(arr[idx]);
    }
    return (
        <div className={cn("flex items-center flex-col gap-2 justify-center h-[70dvh]", className)}>
            <Button onClick={() => {addMockTab(0)}}>Add Example 1</Button>
            <Button onClick={() => {addMockTab(1)}}>Add Example 2</Button>
        </div>
    );
};

export default FilePicker;