import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-white/60 text-sm">
          Data provided by Fantasy Premier League API
        </p>
        <p className="text-white/40 text-sm mt-1">
          Powered by XGBoost & PuLP
        </p>
        <p className="text-white/30 text-xs mt-4">
          © {new Date().getFullYear()} FPL Optimizer. Not affiliated with the Premier League.
        </p>
      </div>
    </footer>
  );
}
