import nextDynamic from "next/dynamic";

const AdminClient = nextDynamic(() => import("@/components/admin/AdminClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm font-medium text-zinc-400">Loading Admin Control Center...</p>
    </div>
  ),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  return <AdminClient />;
}
