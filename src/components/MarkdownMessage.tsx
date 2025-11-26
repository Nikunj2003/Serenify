import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
    content: string;
    className?: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Override default elements for better styling if needed
                    a: ({ node, ...props }) => <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />,
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                            <code className={cn("bg-muted p-1 rounded text-xs font-mono block overflow-x-auto my-2", className)} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                            </code>
                        )
                    },
                    p: ({ node, ...props }) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownMessage;
