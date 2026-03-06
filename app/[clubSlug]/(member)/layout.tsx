export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already handles auth redirects for protected routes.
  // This layout renders for all (member) routes, including /login.
  // Just render children — individual pages fetch their own data.
  return <>{children}</>;
}
