import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { respondToRequest } from "@/lib/requests";

export default async function RespondPage({
  params,
}: {
  params: Promise<{ id: string; action: string }>;
}) {
  const { id, action } = await params;
  if (action !== "accept" && action !== "decline") redirect("/schedule");

  const s = await getSession();
  if (!s.userId) redirect("/login");

  await respondToRequest(id, s.userId, action);
  redirect("/schedule");
}
