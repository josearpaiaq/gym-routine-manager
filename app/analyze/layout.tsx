import Navbar from "@/components/Navbar";

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      {children}
    </main>
  );
}
