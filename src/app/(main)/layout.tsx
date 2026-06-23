import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
