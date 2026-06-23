export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rates-500/10 via-background to-purple-500/10" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-rates-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
