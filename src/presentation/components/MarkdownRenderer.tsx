import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
    content: string
    className?: string
}

/**
 * MarkdownRenderer Component
 * Renders markdown content with proper styling for light/dark mode.
 * Supports GitHub-flavored markdown (tables, task lists, strikethrough, etc.)
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headers
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h3>
                    ),
                    // Paragraphs
                    p: ({ children }) => (
                        <p className="mb-2 text-sm leading-relaxed text-foreground/90">{children}</p>
                    ),
                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1 text-sm text-foreground/90">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1 text-sm text-foreground/90">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                    ),
                    // Strong and emphasis
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                    // Code
                    code: ({ children, className }) => {
                        const isInline = !className
                        return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                                {children}
                            </code>
                        ) : (
                            <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-muted rounded-lg overflow-x-auto my-2">{children}</pre>
                    ),
                    // Blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 italic my-2 text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {children}
                        </a>
                    ),
                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full text-sm border border-border rounded-lg">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-3 py-2 text-left font-semibold border-b border-border">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-3 py-2 border-b border-border/50">{children}</td>
                    ),
                    // Horizontal rule
                    hr: () => <hr className="my-4 border-border" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
