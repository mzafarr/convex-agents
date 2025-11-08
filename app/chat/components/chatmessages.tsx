"use client"

import { api } from "@/convex/_generated/api";
import { toUIMessages, UIMessage, useSmoothText, useThreadMessages } from "@convex-dev/agent/react";
import { useEffect, useRef } from "react";
import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot } from "lucide-react";

function MessageBubble({ message }: { message: UIMessage }) {
    const isUser = message.role === "user" || message.role === "data";
    const isAssistant = message.role === "assistant";
    const isStreaming = message.status === "streaming";
    const [visibleText] = useSmoothText(message.content, { startStreaming: isStreaming });

    return (
        <div className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
            {/* Assistant avatar */}
            {!isUser && (
                <div className="size-7 shrink-0 grid place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md ring-1 ring-black/5">
                    <Bot className="size-4" />
                </div>
            )}

            <div
                className={`group relative max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 ${isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-gradient-to-br from-muted to-muted/70 text-foreground rounded-bl-sm"
                    }`}
            >
                {isAssistant ? (
                    <ReactMarkdown
                        className="text-sm leading-relaxed break-words space-y-2 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_code]:font-mono"
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
                                <pre className="mt-2 rounded-md bg-zinc-950 text-zinc-50 p-3 overflow-x-auto text-xs">
                                    {props.children}
                                </pre>
                            ),
                            code: (
                                { inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>,
                            ) =>
                                inline ? (
                                    <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                ),
                        }}
                    >
                        {visibleText}
                    </ReactMarkdown>
                ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{visibleText}</div>
                )}
                {isAssistant && isStreaming && (
                    <div className="mt-1 flex gap-1">
                        <span className="size-1.5 rounded-full bg-foreground/60 animate-pulse" />
                        <span className="size-1.5 rounded-full bg-foreground/40 animate-pulse [animation-delay:120ms]" />
                        <span className="size-1.5 rounded-full bg-foreground/30 animate-pulse [animation-delay:240ms]" />
                    </div>
                )}
            </div>

            {/* User avatar */}
            {isUser && (
                <div className="size-7 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <span className="text-[11px] font-semibold">You</span>
                </div>
            )}
        </div>
    );
}

const ChatMessages = ({ threadId }: { threadId: string }) => {

    const messages = useThreadMessages(
        api.queries.messages,
        {
            threadId
        },
        {
            initialNumItems: 10,
            stream: true
        }
    )

    const scrollRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
        }
    }, [messages.results?.length])

    return (
        <div className="space-y-3">
            {toUIMessages(messages.results ?? []).map((message, index) => {
                const messageWithId = message as UIMessage & { id?: string; _id?: string };
                const stableKey = messageWithId.id ?? messageWithId._id ?? `${message.role}:${message.content?.slice(0, 24) ?? ""}:${index}`;
                return <MessageBubble key={stableKey} message={message} />;
            })}
            <div ref={scrollRef} />
        </div>
    )
}

export default ChatMessages;