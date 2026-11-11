import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "@/auth";

async function handleGoogleSignIn() {
    "use server";
    await signIn("google");
}

async function handleGithubSignIn() {
    "use server";
    await signIn("github");
}

const SignInFormClient = () => {
    return (
        <div className="relative w-full max-w-md group">

            <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-violet-500/20 opacity-75 blur-xl transition duration-500 group-hover:opacity-100" />

            <Card className="relative w-full overflow-hidden rounded-2xl border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.09)] dark:shadow-2xl">

                <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />

                <CardHeader className="space-y-3 pb-6 pt-8 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Let&apos;s build together.
                    </CardTitle>

                    <CardDescription className="text-base text-muted-foreground">
                        Sign in to continue with{" "}
                        <span className="font-medium text-foreground">
                            CodeSphere
                        </span>
                        .
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-7">
                    {/* Google OAuth Form */}
                    <form action={handleGoogleSignIn}>
                        <Button
                            type="submit"
                            variant="outline"
                            className="group/btn relative h-12 w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-background/50 text-base font-medium text-slate-800 dark:text-foreground shadow-2xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-accent hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <FcGoogle className="mr-3 h-5 w-5 transition-transform duration-200 group-hover/btn:scale-110" />
                            <span>Continue with Google</span>
                        </Button>
                    </form>

                    {/* GitHub OAuth Form */}
                    <form action={handleGithubSignIn}>
                        <Button
                            type="submit"
                            className="
                                group/github
                                relative
                                h-12
                                w-full
                                rounded-xl
                                text-base
                                font-medium
                                text-white
                                bg-gradient-to-r
                                from-blue-600
                                via-indigo-600
                                to-violet-600
                                shadow-lg
                                shadow-indigo-500/20
                                transition-all
                                duration-200
                                hover:opacity-95
                                hover:scale-[1.01]
                                active:scale-[0.99]
                            "
                        >
                            <FaGithub className="mr-3 h-5 w-5 transition-transform duration-200 group-hover/github:scale-110" />
                            <span>Continue with GitHub</span>
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="mt-4 border-t border-slate-200/80 dark:border-white/5 bg-slate-50/90 dark:bg-muted/20 px-7 py-5">
                    <p className="w-full text-center text-xs leading-5 text-slate-600 dark:text-muted-foreground">
                        By continuing, you agree to our{" "}
                        <a
                            href="#"
                            className="font-medium text-slate-900 dark:text-foreground/90 underline underline-offset-4 transition-colors hover:text-indigo-600 dark:hover:text-cyan-400"
                        >
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                            href="#"
                            className="font-medium text-slate-900 dark:text-foreground/90 underline underline-offset-4 transition-colors hover:text-indigo-600 dark:hover:text-cyan-400"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default SignInFormClient;