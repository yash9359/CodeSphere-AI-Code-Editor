import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 px-6 py-8">
        <Link
          href="https://github.com/yash9359"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition-transform duration-300 hover:scale-110"
        >
          <FaGithub className="h-6 w-6 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />
        </Link>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} CodeSphere AI Editor. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}