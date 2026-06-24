import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { RightSidebar } from "@/components/layout/right-sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex min-h-screen pb-16 lg:pb-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
}
