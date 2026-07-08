
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Image from "next/image"
import { SiGithub } from "react-icons/si";

const AddRepo = () => {
    return (
        <div
            className="
            group
            px-6 py-6
            flex justify-between items-center
            rounded-xl
            border border-border
            bg-card
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
                    flex items-center justify-center
                    bg-background
                    border-border

                    transition-all duration-300

                    group-hover:border-blue-500
                    group-hover:bg-blue-500/10
                    group-hover:text-blue-500
                    group-hover:shadow-lg
                    group-hover:shadow-blue-500/20
                "
                >
                    <ArrowDown
                        size={24}
                        className="transition-transform duration-300 group-hover:translate-y-1"
                    />
                </Button>

                <div className="flex flex-col">
                    <h1
                        className="
                        text-xl
                        font-bold
                        transition-colors
                        duration-300
                        group-hover:text-blue-500
                    "
                    >
                        Open GitHub Repository
                    </h1>

                    <p className="text-sm text-muted-foreground max-w-[220px]">
                        Work with your repositories in our editor
                    </p>
                </div>
            </div>

            <SiGithub
                size={120}
                className="
        text-[#407BFF]
        opacity-90
        transition-all
        duration-500
        ease-out
        group-hover:scale-110
        group-hover:-rotate-6
        group-hover:text-[#3B82F6]
        group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]
    "
            />
        </div>
    )
}

export default AddRepo


