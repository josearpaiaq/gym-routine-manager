export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas text-text">
      {children}
    </main>
  );
}
