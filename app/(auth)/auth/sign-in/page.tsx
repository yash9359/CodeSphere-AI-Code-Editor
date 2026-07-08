import SignInFormClient from "@/modules/auth/components/sigin-in-form-client";
import Image from "next/image";

const Page = () => {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12 lg:px-12">
      <div className="grid w-full grid-cols-1 items-center gap-20 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl" />

            <Image
              src="/CodeSphereSmall.png"
              alt="CodeSphere Logo"
              width={320}
              height={320}
              priority
              className="relative z-10 h-auto w-64 lg:w-80 drop-shadow-[0_0_40px_rgba(34,211,238,0.25)]"
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

          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
            Build the future with CodeSphere.
            <br />
            Powered by intelligence.
            Crafted for developers.
          </p>
        </div>

        {/* Right */}
        <div className="flex justify-center lg:justify-end">
          <SignInFormClient />
        </div>
      </div>
    </section>
  );
};

export default Page;