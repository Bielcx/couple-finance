import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-10 sm:pb-10">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
