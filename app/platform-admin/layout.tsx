export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark" style={{ colorScheme: "dark" }}>
      {children}
    </div>
  );
}
