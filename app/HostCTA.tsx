import Link from "next/link";

export default function HostCTA() {
  return (
    <div className="mt-6 text-center text-sm text-stone-500 max-w-md">
      Running a retreat and want to use Pairwise? Email us at{" "}
      <a href="mailto:hello@pairwise.now" className="text-accent-600 hover:text-accent-700 underline">
        hello@pairwise.now
      </a>{" "}
      and{" "}
      <Link href="/about" className="text-accent-600 hover:text-accent-700 underline">
        learn more
      </Link>
      .
    </div>
  );
}
