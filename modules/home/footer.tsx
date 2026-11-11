import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-slate-200/80 bg-white/60 backdrop-blur-sm dark:border-zinc-800 dark:bg-transparent">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 py-7">
        <Link
          href="https://github.com/yash9359"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition-transform duration-300 hover:scale-110"
        >
          <FaGithub className="h-6 w-6 text-slate-600 transition-colors hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white" />
        </Link>

        <p className="text-center text-sm text-slate-600 dark:text-zinc-400">
          © {new Date().getFullYear()} CodeSphere AI Editor. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}