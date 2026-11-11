import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative z-20 flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-6 pb-10 pt-4 text-center">

      <div className="flex flex-col items-center">

        <div className="relative group">
          <div className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-violet-500/25 dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-violet-500/20 blur-2xl transition-all duration-500 group-hover:blur-3xl" />
          <Image
            src="/CodeSphereSmall.png"
            alt="CodeSphere Logo"
            width={280}
            height={280}
            priority
            className="relative z-10 h-auto w-48 sm:w-56 md:w-60 lg:w-64 object-contain drop-shadow-[0_12px_24px_rgba(37,99,235,0.15)] dark:drop-shadow-none transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>


        <h1
          className="
            mt-6
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


      <p className="mt-6 max-w-2xl px-2 text-center text-base leading-relaxed text-slate-600 dark:text-muted-foreground sm:text-lg md:leading-8">
        CodeSphere Editor is a powerful and intelligent code editor that
        enhances your coding experience with advanced features and seamless
        integration. Designed to help you{" "}
        <span className="font-semibold text-slate-800 dark:text-foreground/90">
          write, debug, and optimize
        </span>{" "}
        your code efficiently.
      </p>


      <div className="mt-3.5">
        <Link href="/dashboard">
          <Button
            variant="brand"
            size="lg"
            className="
              group
              h-12
              rounded-xl
              px-8
              text-base
              font-medium
              text-white
              bg-gradient-to-r
              from-blue-600
              via-indigo-600
              to-violet-600
              dark:from-cyan-500
              dark:via-blue-600
              dark:to-violet-600
              shadow-lg
              shadow-indigo-500/25
              transition-all
              duration-200
              hover:opacity-95
              hover:shadow-xl
              hover:shadow-indigo-500/35
              hover:scale-[1.02]
              active:scale-[0.99]
            "
          >
            <span>Get Started</span>
            <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}