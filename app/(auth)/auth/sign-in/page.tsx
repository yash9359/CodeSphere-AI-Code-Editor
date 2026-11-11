import SignInFormClient from "@/modules/auth/components/sigin-in-form-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

const Page = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-[#f3f7fd] to-slate-100 dark:bg-none dark:bg-background flex items-center justify-center px-6 py-12 lg:px-12">

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f172a0f_1px,transparent_1px),linear-gradient(to_bottom,#0f172a0f_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_90%_85%_at_50%_50%,#000_75%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-400/20 dark:bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-400/20 dark:bg-violet-500/10 blur-3xl" />

      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

          <div className="relative group">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-violet-500/25 dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-violet-500/20 blur-2xl transition-all duration-500 group-hover:blur-3xl" />
            <Image
              src="/CodeSphereSmall.png"
              alt="CodeSphere Logo"
              width={300}
              height={300}
              priority
              className="relative z-10 h-auto w-60 lg:w-72 object-contain drop-shadow-[0_12px_28px_rgba(37,99,235,0.16)] dark:drop-shadow-none transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>


          <h1
            className="
              mt-8
              text-5xl
              font-extrabold
              tracking-tight
              lg:text-6xl
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
            CodeSphere
          </h1>


          <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
            Build the future with CodeSphere.
            <br />
            Powered by intelligence. Crafted for developers.
          </p>
        </div>

        {/* Right: Sign-In Form Container */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <SignInFormClient />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;