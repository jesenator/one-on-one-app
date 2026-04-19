import Link from "next/link";

export default function HostCTA() {
  return (
    <div className="mt-6 text-center text-sm text-stone-500 max-w-md">
      Running a retreat and want to use Pairwise?{" "}
      <a href="mailto:hello@pairwise.now" className="text-accent-600 hover:text-accent-700 underline">
        Email us
      </a>
      .{" "}
      <Link href="/about" className="text-accent-600 hover:text-accent-700 underline">
        Learn more
      </Link>
      .
    </div>
  );
}
