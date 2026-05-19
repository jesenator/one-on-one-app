import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const AVATAR_COLORS = [
  "bg-accent-500",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-stone-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-violet-600",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const s = await getSession();
  if (!s.userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  const isOwnProfile = s.userId === userId;
  const avatarColor = getAvatarColor(userId);
  const initials = getInitials(user.name);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href="/attendees"
        className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-accent-600 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        All attendees
      </Link>
      {/* Header */}
      <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6">
        <div className="flex items-start gap-4">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border border-stone-200 shrink-0"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shrink-0`}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">{user.name}</h1>
            {user.tagline && (
              <p className="text-sm text-stone-500 mt-0.5">{user.tagline}</p>
            )}
            {user.careerStage && (
              <p className="text-xs text-stone-400 mt-1">
                <span className="font-medium text-stone-500">Career stage:</span>{" "}
                {user.careerStage}
              </p>
            )}
          </div>
        </div>

        {/* Links */}
        {(user.linkedinUrl || user.websiteUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                </svg>
                LinkedIn
              </a>
            )}
            {user.websiteUrl && (
              <a
                href={user.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                </svg>
                Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* About Me */}
      {user.aboutMe && (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-2">About Me</h2>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{user.aboutMe}</p>
        </div>
      )}

      {/* Goals */}
      {user.goals && (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-2">
            What are they hoping to get out of the event?
          </h2>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{user.goals}</p>
        </div>
      )}

      {/* Can Help With */}
      {user.canHelpWith && (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-2">How I can help others</h2>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{user.canHelpWith}</p>
        </div>
      )}

      {/* Request 1:1 */}
      {!isOwnProfile && (
        <Link
          href="/schedule"
          className="block w-full text-center px-4 py-3 text-sm font-semibold text-white bg-accent-500 rounded-md hover:bg-accent-600"
        >
          Request 1:1
        </Link>
      )}
    </div>
  );
}
