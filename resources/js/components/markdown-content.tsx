import React from 'react';

type Props = {
    content: string;
    className?: string;
};

/**
 * Render inline markdown elements: **bold**, *italic*, `code`, and [link](url)
 */
function renderInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Token regex matches:
    // 1. `code`
    // 2. **bold**
    // 3. *italic* or _italic_
    // 4. [text](url)
    const regex =
        /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*|_([^_]+)_)|(\[([^\]]+)\]\(([^)]+)\))/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[2] !== undefined) {
            // Inline code: `code`
            nodes.push(
                <code
                    key={`code-${match.index}`}
                    className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                    {match[2]}
                </code>,
            );
        } else if (match[4] !== undefined) {
            // Bold: **bold**
            nodes.push(
                <strong
                    key={`bold-${match.index}`}
                    className="font-bold text-slate-900 dark:text-white"
                >
                    {match[4]}
                </strong>,
            );
        } else if (match[6] !== undefined || match[7] !== undefined) {
            // Italic: *italic* or _italic_
            nodes.push(
                <em key={`italic-${match.index}`} className="italic">
                    {match[6] ?? match[7]}
                </em>,
            );
        } else if (match[9] !== undefined && match[10] !== undefined) {
            // Link: [text](url)
            nodes.push(
                <a
                    key={`link-${match.index}`}
                    href={match[10]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    {match[9]}
                </a>,
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes.length > 0 ? nodes : [text];
}

export function MarkdownContent({ content, className = '' }: Props) {
    if (!content) {
        return null;
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockLines: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = (key: string) => {
        if (listType === 'ul' && listItems.length > 0) {
            elements.push(
                <ul
                    key={`ul-${key}`}
                    className="my-2 ml-4 list-disc space-y-1 text-sm leading-relaxed"
                >
                    {listItems}
                </ul>,
            );
        } else if (listType === 'ol' && listItems.length > 0) {
            elements.push(
                <ol
                    key={`ol-${key}`}
                    className="my-2 ml-4 list-decimal space-y-1 text-sm leading-relaxed"
                >
                    {listItems}
                </ol>,
            );
        }
        listType = null;
        listItems = [];
    };

    const flushCodeBlock = (key: string) => {
        if (codeBlockLines.length > 0) {
            elements.push(
                <div
                    key={`codeblock-${key}`}
                    className="my-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 shadow-inner"
                >
                    {codeBlockLanguage && (
                        <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            {codeBlockLanguage}
                        </div>
                    )}
                    <pre className="whitespace-pre">
                        <code>{codeBlockLines.join('\n')}</code>
                    </pre>
                </div>,
            );
        }
        inCodeBlock = false;
        codeBlockLanguage = '';
        codeBlockLines = [];
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // 1. Code blocks (```lang ... ```)
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                flushCodeBlock(`cb-end-${index}`);
            } else {
                flushList(`cb-start-${index}`);
                inCodeBlock = true;
                codeBlockLanguage = trimmed.slice(3).trim();
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockLines.push(line);
            return;
        }

        // 2. Unordered lists: - item or * item
        const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
        if (ulMatch) {
            if (listType !== 'ul') {
                flushList(`ul-switch-${index}`);
                listType = 'ul';
            }
            listItems.push(
                <li key={`li-${index}`} className="pl-1">
                    {renderInline(ulMatch[2])}
                </li>,
            );
            return;
        }

        // 3. Ordered lists: 1. item
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
        if (olMatch) {
            if (listType !== 'ol') {
                flushList(`ol-switch-${index}`);
                listType = 'ol';
            }
            listItems.push(
                <li key={`oli-${index}`} className="pl-1">
                    {renderInline(olMatch[2])}
                </li>,
            );
            return;
        }

        // If not in a list, flush any pending list
        flushList(`flush-${index}`);

        // Empty line
        if (trimmed === '') {
            return;
        }

        // 4. Headers: ### H3, ## H2, # H1
        if (trimmed.startsWith('### ')) {
            elements.push(
                <h4
                    key={`h4-${index}`}
                    className="mt-3 mb-1 text-base font-bold text-slate-900 dark:text-white"
                >
                    {renderInline(trimmed.slice(4))}
                </h4>,
            );
            return;
        }
        if (trimmed.startsWith('## ')) {
            elements.push(
                <h3
                    key={`h3-${index}`}
                    className="mt-4 mb-1.5 text-lg font-bold text-slate-900 dark:text-white"
                >
                    {renderInline(trimmed.slice(3))}
                </h3>,
            );
            return;
        }
        if (trimmed.startsWith('# ')) {
            elements.push(
                <h2
                    key={`h2-${index}`}
                    className="mt-4 mb-2 text-xl font-bold text-slate-900 dark:text-white"
                >
                    {renderInline(trimmed.slice(2))}
                </h2>,
            );
            return;
        }

        // 5. Blockquote: > text
        if (trimmed.startsWith('> ')) {
            elements.push(
                <blockquote
                    key={`quote-${index}`}
                    className="my-2 border-l-4 border-slate-500 pl-3 italic text-slate-700 dark:border-slate-400 dark:text-slate-300"
                >
                    {renderInline(trimmed.slice(2))}
                </blockquote>,
            );
            return;
        }

        // 6. Regular paragraph
        elements.push(
            <p
                key={`p-${index}`}
                className="my-1.5 leading-relaxed break-words"
            >
                {renderInline(line)}
            </p>,
        );
    });

    flushList('final');
    flushCodeBlock('final');

    return (
        <div className={`space-y-1 text-sm leading-relaxed ${className}`}>
            {elements}
        </div>
    );
}
