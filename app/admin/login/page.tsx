import { AdminLogin } from "@/components/admin/admin-login";

// Legacy entry point, kept so old bookmarks keep working. After signing in the
// person is forwarded by /admin to their own /<slug>/admin panel.
export const instant = false;

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AdminLogin error={error} />;
}
