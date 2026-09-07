import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { isFacilitator } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "מנחה · כתב שנראה קצת אחרת",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The facilitator area: the server decides what to render from the signed cookie. */
export default async function AdminPage() {
  const facilitator = await isFacilitator();
  return facilitator ? <AdminDashboard /> : <AdminLogin />;
}
