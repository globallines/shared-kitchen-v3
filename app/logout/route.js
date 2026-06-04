import { clearSession } from "../../lib/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export async function GET() {
  await clearSession();
  redirect("/login");
}
