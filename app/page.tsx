import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!s.retreatId) redirect("/select-retreat");
  redirect("/app/schedule");
}
