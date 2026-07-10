import Navbar from "@/src/components/Navbar";
import CatalogGenerator from "@/src/components/CatalogGenerator";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <CatalogGenerator />
    </div>
  );
}
