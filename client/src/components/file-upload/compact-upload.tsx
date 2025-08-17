'use client';

import {
    useFileUpload,
    type FileWithPreview,
} from '@/hooks/use-file-upload';
import {Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {PlusIcon, TriangleAlert, XIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {BiSolidFilePdf} from "react-icons/bi";
import {LoaderFive} from "@/components/ui/loader.tsx";
import {toast} from "sonner";
import {APIBatchUploadDocuments} from "@/apis/helper.ts";
import {useAppContext} from "@/contexts/app.ts";

interface FileUploadCompactProps {
    maxFiles?: number;
    maxSize?: number;
    accept?: string;
    multiple?: boolean;
    className?: string;
    onFilesChange?: (files: FileWithPreview[]) => void;
}

export default function FileUploadCompact({
                                              maxFiles = 3,
                                              maxSize = 2 * 1024 * 1024, // 2MB
                                              accept = 'image/*',
                                              multiple = true,
                                              className,
                                              onFilesChange,
                                          }: FileUploadCompactProps) {
    const [
        {files, isDragging, errors},
        {removeFile, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps},
    ] = useFileUpload({
        maxFiles,
        maxSize,
        accept,
        multiple,
        onFilesChange,
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const {setDocumentRefresh} = useAppContext();

    const handleFileUpload = () => {
        // validation
        if (files.length === 0) {
            toast.info('No files uploaded!');
            return;
        }
        if (files.length > maxFiles) {
            toast.error(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        setUploading(true);
        const filesArr: File[] = files.map(file => file.file as File);
        APIBatchUploadDocuments(filesArr)
            .then((response) => {
                toast.success(response.message);
                // Clear files after successful upload
                files.forEach(file => removeFile(file.id));
                setDialogOpen(false);
                if (onFilesChange) {
                    onFilesChange([]);
                }
                setDocumentRefresh(true);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to upload files. Please try again.');
            })
            .finally(() => setUploading(false));
    }
    return (
        <div className={cn('w-full max-w-lg', className)}>
            {/* Compact Upload Area */}
            <div
                className={cn(
                    'flex justify-center items-center flex-col gap-3 rounded-lg border border-border border-dashed p-4 transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input {...getInputProps()} className="sr-only"/>
                {/* File Previews */}
                <div className="flex flex-1 items-center gap-2">

                    {/* Upload Button */}
                    <Button onClick={openFileDialog} size="sm" className={cn(isDragging && 'animate-bounce')}>
                        <PlusIcon className="h-4 w-4"/>
                        Add files
                    </Button>

                    <p className="text-sm text-muted-foreground">Drop files here or click to browse
                        (max {maxFiles} files)</p>

                </div>
                {files.length > 0 && (
                    <div className={'flex items-center w-full gap-2 justify-end'}>
                        {!uploading && <><p
                                onClick={() => setDialogOpen(true)}
                                className={'shrink-0 text-xs text-muted-foreground underline cursor-pointer hover:text-primary duration-100'}>
                                {files.length} selected file{files.length > 1 ? 's' : ''}
                            </p>
                                <Button
                                    size={'sm'}
                                    variant={'secondary'}
                                    onClick={handleFileUpload}
                                >
                                    Upload
                                </Button></>
                            ||
                            <LoaderFive
                                text={"Uploading & Processing..."}
                            />}
                    </div>
                )}

            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <Alert variant="destructive" appearance="light" className="mt-5">
                    <AlertIcon>
                        <TriangleAlert/>
                    </AlertIcon>
                    <AlertContent>
                        <AlertTitle>File upload error(s)</AlertTitle>
                        <AlertDescription>
                            {errors.map((error, index) => (
                                <p key={index} className="last:mb-0">
                                    {error}
                                </p>
                            ))}
                        </AlertDescription>
                    </AlertContent>
                </Alert>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selected files queue ({files.length})</DialogTitle>
                        <DialogDescription>Manage your selection queue before uploading.</DialogDescription>
                    </DialogHeader>
                    <div className={'flex flex-col gap-2 max-h-[60vh] overflow-y-auto min-h-[200px] h-full'}>
                        {files.length === 0 && (
                            <div className={'flex items-center justify-center h-[80%]'}><p
                                className="text-destructive">No files selected.</p></div>
                        )}
                        {files.map((file, index) => (
                            <div key={index}
                                 className="flex items-center justify-between p-2 border-b last:border-none">
                                <div className="flex items-center gap-2">
                                    <BiSolidFilePdf className="h-5 w-5 text-muted-foreground"/>
                                    <a
                                        href={file.preview}
                                        target={'_blank'}
                                        rel={'noopener noreferrer nofollow'}
                                        className="text-sm hover:underline"
                                    >
                                        {file.file.name}
                                    </a>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFile(file.id)}
                                >
                                    <XIcon className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
