import { AdminLogin } from "@/components/admin/admin-login";

// Next 16: reading searchParams blocks the route, which is fine for a login page.
export const instant = false;

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect } = await searchParams;
  return <AdminLogin error={error} redirect={redirect} />;
}
