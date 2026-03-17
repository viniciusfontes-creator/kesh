'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
  noInvert?: boolean
}

export function MarkdownContent({ content, className, noInvert }: MarkdownContentProps) {
  return (
    <div className={cn(
        "prose prose-zinc max-w-none text-[15px] leading-relaxed",
        !noInvert && "dark:prose-invert",
        noInvert && [
            "text-inherit",
            "[--tw-prose-body:currentColor]",
            "[--tw-prose-headings:currentColor]",
            "[--tw-prose-bold:currentColor]",
            "[--tw-prose-bullets:currentColor]",
            "[--tw-prose-quotes:currentColor]",
            "[--tw-prose-code:currentColor]",
            "[--tw-prose-links:currentColor]",
            "prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-li:text-inherit prose-code:text-inherit"
        ],
        "prose-p:leading-relaxed prose-pre:bg-zinc-200 dark:prose-pre:bg-zinc-800 prose-pre:rounded-xl prose-pre:p-3",
        noInvert && "prose-pre:bg-background/20 prose-pre:text-inherit",
        "prose-pre:my-2 prose-p:my-1 prose-ul:my-1",
        "prose-code:bg-zinc-200 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
        "prose-strong:font-bold prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-ul:list-disc prose-ul:ml-4 prose-li:mt-1",
        className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
