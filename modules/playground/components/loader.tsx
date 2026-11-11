import { Loader2 } from "lucide-react";
import { type LoadingStepProps } from "../types/index";

export const LoadingStep: React.FC<LoadingStepProps> = ({
    currentStep,
    step,
    label,
}) => (
    <div className="flex items-center gap-3 py-2 justify-start">
        <div
            className={`rounded-full p-1.5 ${currentStep === step
                ? "bg-blue-500/15 dark:bg-blue-500/20"
                : currentStep > step
                    ? "bg-emerald-500/15 dark:bg-emerald-500/20"
                    : "bg-muted"
                }`}
        >
            {currentStep > step ? (
                <svg
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            ) : currentStep === step ? (
                <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
                <div className="h-4 w-4 rounded-full bg-muted-foreground/25" />
            )}
        </div>
        <span
            className={`text-sm ${currentStep === step
                ? "text-foreground font-medium"
                : currentStep > step
                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                    : "text-muted-foreground"
                }`}
        >
            {label}
        </span>
    </div>
);