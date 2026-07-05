import React from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
       <Card className="w-full max-w-md shadow-lg">
    <CardHeader className="space-y-2">
        <CardTitle className="text-center text-3xl font-semibold">
            Sign In
        </CardTitle>

        <CardDescription className="text-center text-muted-foreground">
            Sign in using your preferred provider.
        </CardDescription>
    </CardHeader>

    <CardContent className="space-y-3">
    <form action={handleGoogleSignIn}>
        <Button
            type="submit"
            variant="outline"
            className="h-11 w-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
        </Button>
    </form>

    <form action={handleGithubSignIn}>
        <Button
            type="submit"
            className="h-11 w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
            <FaGithub className="mr-2 h-5 w-5" />
            Continue with GitHub
        </Button>
    </form>
</CardContent>

    <CardFooter>
        <p className="w-full text-center text-xs text-muted-foreground leading-5">
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
            </a>.
        </p>
    </CardFooter>
</Card>
    );
};

export default SignInFormClient;
