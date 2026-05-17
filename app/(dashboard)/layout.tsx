import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import DashboardShell from "./_components/DashboardShell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Peblo",
    template: "%s | Peblo",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={session.user.name || null}
      userEmail={session.user.email || null}
    >
      {children}
    </DashboardShell>
  );
}
