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
        <Card className="w-full max-w-md border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-center text-3xl font-medium">
                      Let&apos;s build together.
                </CardTitle>

                <CardDescription className="text-center text-base">
                    Sign in to continue with CodeSphere.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <form action={handleGoogleSignIn}>
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-12 w-full rounded-xl text-base transition-all hover:scale-[1.02]"
                    >
                        <FcGoogle className="mr-3 h-5 w-5" />
                        Continue with Google
                    </Button>
                </form>

                <form action={handleGithubSignIn}>
                    <Button
                        type="submit"
                        className="
              h-12
              w-full
              rounded-xl
              text-base
              bg-gradient-to-r
              from-blue-600
              via-indigo-600
              to-violet-600
              hover:opacity-90
            "
                    >
                        <FaGithub className="mr-3 h-5 w-5" />
                        Continue with GitHub
                    </Button>
                </form>
            </CardContent>

            <CardFooter>
                <p className="text-center text-xs leading-5 text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <a
                        href="#"
                        className="font-medium underline underline-offset-4 hover:text-primary"
                    >
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                        href="#"
                        className="font-medium underline underline-offset-4 hover:text-primary"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </CardFooter>
        </Card>
    );
};

export default SignInFormClient;