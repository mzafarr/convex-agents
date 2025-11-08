"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { Authenticated, useConvexAuth, useMutation, useQuery } from "convex/react"
import { useMemo, useState } from "react"
import ChatMessages from "./components/chatmessages"

export default function ChatPage() {
    const [input, setInput] = useState("")
    const [selectedChat, setSelectedChat] = useState<string | null>(null)

    const { isAuthenticated } = useConvexAuth();
    const chats = useQuery(api.queries.conversations, isAuthenticated ? {} : "skip")
    const createNewChat = useMutation(api.mutations.createConversation)
    const sendMessage = useMutation(api.mutations.sendMessage)

    const activeChatTitle = useMemo(() => {
        return chats?.find((c) => c.threadId === selectedChat)?.conversationTitle ?? null
    }, [chats, selectedChat])

    if (isAuthenticated && !chats) {
        return (
            <Authenticated>
                <div className="min-h-screen grid place-items-center">Loading...</div>
            </Authenticated>
        )
    }

    return (
        <Authenticated>
            <div className="min-h-screen grid grid-cols-[280px_1fr] bg-background">
                {/* Sidebar */}
                <aside className="h-[100dvh] flex flex-col border-r bg-card/60 backdrop-blur-sm">
                    <div className="px-4 py-3 border-b">
                        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Chats</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {chats?.map((chat) => {
                            const isActive = chat.threadId === selectedChat
                            return (
                                <button
                                    key={chat._id}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${isActive
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-muted"
                                        }`}
                                    onClick={() => setSelectedChat(chat.threadId)}
                                >
                                    {chat.conversationTitle}
                                </button>
                            )
                        })}
                        {chats && chats.length === 0 && (
                            <div className="text-xs text-muted-foreground px-2 py-4">No conversations yet</div>
                        )}
                    </div>
                    <div className="p-3 border-t">
                        <Button
                            className="w-full"
                            size="sm"
                            onClick={async () => {
                                await createNewChat()
                            }}
                        >
                            New Chat
                        </Button>
                    </div>
                </aside>

                {/* Main panel */}
                <main className="flex flex-col h-[100dvh]">
                    <header className="h-12 flex items-center border-b px-4 bg-background/80 backdrop-blur">
                        <div className="max-w-3xl w-full mx-auto flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                                {activeChatTitle ?? "Select a chat"}
                            </div>
                        </div>
                    </header>

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="max-w-3xl mx-auto space-y-4">
                            {!selectedChat && (
                                <div className="h-full min-h-[50vh] grid place-items-center">
                                    <div className="text-sm text-muted-foreground">Select a chat or create a new one to get started.</div>
                                </div>
                            )}
                            {selectedChat && <ChatMessages threadId={selectedChat} />}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <form
                            className="max-w-3xl mx-auto p-3 flex items-center gap-2"
                            onSubmit={async (e) => {
                                e.preventDefault()
                                if (!input || !selectedChat) return
                                await sendMessage({
                                    threadId: selectedChat,
                                    message: input,
                                })
                                setInput("")
                            }}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedChat ? "Type a message..." : "Select a chat to start messaging"}
                                className="flex-1"
                                disabled={!selectedChat}
                            />
                            <Button type="submit" disabled={!input || !selectedChat}>
                                Send
                            </Button>
                        </form>
                    </div>
                </main>
            </div>
        </Authenticated>
    )
}