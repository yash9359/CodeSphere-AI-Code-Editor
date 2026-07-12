"use client";

import { Button } from "@/components/ui/button"
// import { createPlayground } from "@/features/playground/actions";
import { Plus } from 'lucide-react'
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useState } from "react"
import { toast } from "sonner";
import TemplateSelectingModal from "./template-selecting-modal";

const AddNewButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                transition-all duration-300 ease-out

                hover:-translate-y-1
                hover:scale-[1.02]
                hover:border-blue-500/70
                hover:bg-card
                hover:shadow-[0_0_25px_rgba(59,130,246,0.18)]
            "
            >
                <div className="flex items-start gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="
                        bg-background
                        border-border
                        transition-all
                        duration-300

                        group-hover:border-blue-500
                        group-hover:bg-blue-500/10
                        group-hover:text-blue-500
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
                            group-hover:text-blue-500
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
                     group-hover:text-[#3B82F6]
        group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]
                "
                />
            </div>

            {/* TODO: Implement Template Selecting Modal here */}
            
            <TemplateSelectingModal
            isOpen={isModalOpen}
            onClose={()=>setIsModalOpen(false)}
            onSubmit={()=>{}}
            />
        </>
    )
}

export default AddNewButton
