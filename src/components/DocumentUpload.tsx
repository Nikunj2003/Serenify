import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFile {
    name: string;
    status: "uploading" | "processing" | "completed" | "error";
    progress: number;
    error?: string;
}

const DocumentUpload = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user) return;

        const newFiles = acceptedFiles.map(file => ({
            name: file.name,
            status: "uploading" as const,
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);

        for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            try {
                // 1. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                setFiles(prev => prev.map(f =>
                    f.name === file.name ? { ...f, status: "processing", progress: 50 } : f
                ));

                // 2. Extract text (Simulated for now, real implementation would use a server function or library)
                const textContent = await extractText(file);

                // 3. Generate Embedding & Store (Placeholder for now, will connect to ai-service later)
                // For now, we just store the document record in 'embeddings' table with dummy embedding
                // In the next step, we will implement the actual embedding generation.

                // Simulating processing delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                setFiles(prev => prev.map(f =>
                    f.name === file.name ? { ...f, status: "completed", progress: 100 } : f
                ));

                if (onUploadComplete) onUploadComplete();

            } catch (error: any) {
                console.error("Upload error:", error);
                setFiles(prev => prev.map(f =>
                    f.name === file.name ? { ...f, status: "error", error: error.message } : f
                ));
                toast({
                    title: "Upload failed",
                    description: `Failed to upload ${file.name}: ${error.message}`,
                    variant: "destructive"
                });
            }
        }
    }, [user, toast, onUploadComplete]);

    // Simple text extraction for .txt files, placeholder for PDFs
    const extractText = async (file: File): Promise<string> => {
        if (file.type === "text/plain") {
            return await file.text();
        }
        // TODO: Implement PDF text extraction
        return "PDF content extraction pending implementation";
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragActive
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-lg">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            PDF or TXT (max 5MB)
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-card border rounded-lg p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${file.status === "error" ? "bg-red-100 text-red-600" :
                                                file.status === "completed" ? "bg-green-100 text-green-600" :
                                                    "bg-blue-100 text-blue-600"
                                            }`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{file.status}</p>
                                        </div>
                                    </div>
                                    {file.status === "uploading" || file.status === "processing" ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    ) : file.status === "completed" ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                                {(file.status === "uploading" || file.status === "processing") && (
                                    <Progress value={file.progress} className="h-1" />
                                )}
                                {file.error && (
                                    <p className="text-xs text-red-500 mt-2">{file.error}</p>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentUpload;
