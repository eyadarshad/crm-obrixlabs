'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onFileSelected: (file: File) => void;
    onUpload?: (file: File) => Promise<string>;
    accept?: string;
    maxSizeMB?: number;
    uploading?: boolean;
}

export function FileUpload({
    onFileSelected,
    accept = '*',
    maxSizeMB = 10,
    uploading = false,
}: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (selectedFile: File) => {
            setError(null);
            if (selectedFile.size > maxSizeMB * 1024 * 1024) {
                setError(`File size must be less than ${maxSizeMB}MB`);
                return;
            }
            setFile(selectedFile);
            onFileSelected(selectedFile);
        },
        [maxSizeMB, onFileSelected]
    );

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            {!file ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
            ${dragActive
                            ? 'border-blue-500 bg-blue-500/5'
                            : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                        }
          `}
                >
                    <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">
                        <span className="text-blue-400 font-medium">Click to upload</span>{' '}
                        or drag and drop
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Max file size: {maxSizeMB}MB
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
                    ) : (
                        <FileIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-gray-500 hover:text-red-400 p-1 h-auto"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}
        </div>
    );
}
