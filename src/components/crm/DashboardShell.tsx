export default function DashboardShell({
  who, children, notice,
}: { who: string; children: React.ReactNode; notice?: string }) {
  return (
    <main className="min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-navy/60">MMD COMMUNITY CARE</p>
            <h1 className="text-lg font-bold text-navy">Applicant board</h1>
          </div>
          <span className="truncate text-xs text-gray-500">{who}</span>
        </div>
      </header>
      {notice && (
        <p className="mx-4 mt-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">{notice}</p>
      )}
      {children}
    </main>
  );
}
