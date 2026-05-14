export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {children}
    </main>
  );
}
