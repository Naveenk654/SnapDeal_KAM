// ============================================================
// Header Component — Snapdeal branding
// ============================================================

export function Header() {
  return (
    <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Snapdeal-style logo area */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-red-600 font-black text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Snapdeal</h1>
            <p className="text-red-200 text-xs leading-tight">
              AI Voice KAM
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-red-400 mx-2" />

        {/* Subtitle */}
        <div className="flex-1">
          <p className="text-sm text-red-100">
            Virtual Key Account Manager — Powered by Gemini + Jev
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 bg-red-800/40 px-3 py-1 rounded-full text-xs">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI Active
        </div>
      </div>
    </header>
  );
}

