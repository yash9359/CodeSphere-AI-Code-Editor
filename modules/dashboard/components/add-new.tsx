"use client";

import { Button } from "@/components/ui/button"
// import { createPlayground } from "@/features/playground/actions";
import { Plus } from 'lucide-react'
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useState } from "react"
import { toast } from "sonner";
import TemplateSelectingModal from "./template-selecting-modal";
import { createPlayground } from "../actions";

const AddNewButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedTemplate, setSelectedTemplate] = useState<{
        title: string;
        template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
        description?: string;
    } | null>(null);

    const router = useRouter();

    const handleSubmit = async (data: {
        title: string;
        template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
        description?: string;
    }) => {
        setSelectedTemplate(data);

        const res = await createPlayground(data);

        toast.success("Playground Created succeddfully")

        setIsModalOpen(false);
        router.push(`playground/${res?.id}`)
    }

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="
                group
                flex items-center justify-between
                rounded-xl
                border border-border
                bg-card
                px-6 py-6
                cursor-pointer
                overflow-hidden
                shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_16px_rgba(15,23,42,0.04)]
                dark:shadow-none
                transition-all duration-300 ease-out

                hover:-translate-y-1
                hover:scale-[1.01]
                hover:border-blue-500/70
                hover:bg-card
                hover:shadow-[0_12px_28px_rgba(37,99,235,0.14)]
                dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.18)]
            "
            >
                <div className="flex items-start gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="
                        bg-slate-50
                        dark:bg-background
                        border-border
                        text-slate-700
                        dark:text-foreground
                        transition-all
                        duration-300

                        group-hover:border-blue-500
                        group-hover:bg-blue-500/10
                        group-hover:text-blue-600
                        dark:group-hover:text-blue-400
                        group-hover:shadow-lg
                        group-hover:shadow-blue-500/20
                    "
                    >
                        <Plus
                            size={24}
                            className="transition-transform duration-300 group-hover:rotate-90"
                        />
                    </Button>

                    <div className="space-y-1">
                        <h1
                            className="
                            text-xl
                            font-bold
                            transition-colors
                            duration-300
                            group-hover:text-blue-600
                            dark:group-hover:text-blue-400
                        "
                        >
                            Add New
                        </h1>

                        <p className="text-sm text-muted-foreground max-w-56">
                            Create a new playground
                        </p>
                    </div>
                </div>

                <Image
                    src="/add-new.svg"
                    alt="Create new playground"
                    width={150}
                    height={150}
                    className="
                    transition-all
                    duration-500
                    group-hover:scale-110
                    group-hover:-rotate-3
                    group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]
                "
                />
            </div>

            {/* TODO: Implement Template Selecting Modal here */}

            <TemplateSelectingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
            />
        </>
    )
}

export default AddNewButton
