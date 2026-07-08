import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center">
        <Image
          src="/CodeSphereSmall.png"
          alt="CodeSphere Logo"
          width={400}
          height={400}
          priority
          className="h-auto w-56 sm:w-64 md:w-72 lg:w-80"
        />

        <h1
          className="
            mt-4
            text-center
            text-4xl
            font-extrabold
            leading-tight
            tracking-tight
            sm:text-5xl
            md:text-6xl
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-violet-600
            bg-clip-text
            text-transparent
            dark:from-cyan-400
            dark:via-blue-500
            dark:to-violet-500
          "
        >
          Code With Intelligence
        </h1>
      </div>

      <p className="mt-8 max-w-2xl px-4 text-center text-base leading-8 text-gray-600 dark:text-gray-400 sm:text-lg">
        CodeSphere Editor is a powerful and intelligent code editor that
        enhances your coding experience with advanced features and seamless
        integration. It is designed to help you write, debug, and optimize your
        code efficiently.
      </p>

      <Link href="/dashboard" className="">
        <Button
          variant="brand"
          size="lg"
          className="
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-violet-600
            dark:from-cyan-400
            dark:via-blue-500
            dark:to-violet-500
          "
        >
          Get Started
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}