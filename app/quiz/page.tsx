"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toUIMessages, UIMessage, useThreadMessages } from "@convex-dev/agent/react";

export default function QuizPage() {

    const formSchema = z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        topic: z.string().min(1),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            title: "",
            description: "",
            topic: "",
        },
        resolver: zodResolver(formSchema),
    })

    const createQuiz = useMutation(api.mutations.createQuiz)
    const quizzes = useQuery(api.queries.quizzes)
    const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)

    const onSubmit = form.handleSubmit(async (data) => {
        await createQuiz({
            title: data.title,
            description: data.description,
            topic: data.topic,
        })

        form.reset()
        toast.success("Quiz created successfully")
    })

    if (!quizzes) {
        return <div>Loading...</div>
    }

    return <div>

        <Dialog>
            <DialogTrigger asChild>
                <Button>Create Quiz</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>

                    <DialogTitle>
                        Create a new quiz
                    </DialogTitle>
                    <DialogDescription>
                        Create a new quiz with a title, description and topic
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit} className="space-y-8">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField control={form.control} name="topic" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Topic</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit">Create Quiz</Button>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>

        <div className="flex gap-4 items-center">
            <div className="space-y-4 flex flex-col w-1/4">
                {quizzes.map((quiz) => (
                    <div key={quiz._id} className="border p-4 rounded-md">
                        <h3 className={`${selectedQuiz === quiz.threadId ? "text-blue-500" : ""}`} onClick={() => setSelectedQuiz(quiz.threadId)}>{quiz.title}</h3>
                    </div>
                ))}
            </div>

            {selectedQuiz && <QuizConversation threadId={selectedQuiz} />}
        </div>
    </div>
}

function QuizConversation({ threadId }: { threadId: string }) {

    const quizQuestionConversations = useThreadMessages(api.queries.quizQuestionConversations, {
        threadId,

    }, {
        initialNumItems: 10,
    })

    const [input, setInput] = useState("")
    const chatWithQuiz = useMutation(api.mutations.chatWithQuiz)

    return <div className="flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-100px)] min-h-[620px]">
            {toUIMessages(quizQuestionConversations.results ?? []).map((message) => (
                <ChatBubble key={message.key} message={message} />
            ))}
        </div>
        <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} />
            <Button onClick={async () => {
                await chatWithQuiz({
                    threadId,
                    message: input,
                })
                setInput("")
            }}>Submit</Button>
            <Button onClick={() => {
                console.log(input)
            }}>Save Quiz</Button>
        </div>
    </div>
}

const ChatBubble = ({ message }: { message: UIMessage }) => {

    const [isVisible, setIsVisible] = useState(false)

    if (message.role === "assistant") {

        type QuizResult = {
            questions: Array<{
                question: string;
                options: string[];
                answer: string;
            }>;
        };

        const structuredContent = JSON.parse(message.content) as QuizResult;

        return <div className="bg-gray-300 p-2 rounded-md">
            <Button onClick={() => {
                setIsVisible(!isVisible)
            }}>
                {isVisible ? "Hide" : "Show"}
            </Button>
            {isVisible && structuredContent.questions.map((question) => (
                <div key={question.question} className="space-y-2 border-b-2 border-black p-2">
                    <h3>{question.question}</h3>
                    <div className="flex flex-col gap-2">
                        {question.options.map((option) => (
                            <div key={option}>{option}</div>
                        ))}
                    </div>
                    <p>Answer: {question.answer}</p>
                </div>
            ))}
        </div>
        // return <div className="bg-gray-300 p-2 rounded-md">{message.content}</div>
    }
    return <div className="bg-blue-100 p-2 rounded-md">{message.content}</div>
}