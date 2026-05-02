import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { respondToRequest } from "@/lib/requests";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

export default async function RespondPage({
  params,
}: {
  params: Promise<{ id: string; action: string }>;
}) {
  const { id, action } = await params;
  if (action !== "accept" && action !== "decline") redirect("/schedule");

  const s = await getSession();
  if (!s.userId) redirect("/login");

  const result = await respondToRequest(id, s.userId, action);
  if (!result.ok) {
    redirect(`/schedule?toast=error&msg=${encodeURIComponent(result.error)}`);
  }
  const when = `${formatSlotDay(result.slotStart)} at ${formatSlotTime(result.slotStart)}`;
  redirect(
    `/schedule?toast=${action}&name=${encodeURIComponent(result.otherName)}&when=${encodeURIComponent(when)}`,
  );
}
