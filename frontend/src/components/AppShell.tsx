import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavItem({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand + Nav */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white font-black">
                  SL
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-extrabold text-slate-900 leading-none">
                    Smart Logistics
                  </div>
                  <div className="text-xs text-slate-500 leading-none">
                    Control center
                  </div>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-50 p-1 border">
                <NavItem to="/" label="Dashboard" />
                <NavItem to="/analytics" label="Analytics" />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile nav */}
              <div className="md:hidden flex items-center gap-1 rounded-2xl bg-slate-50 p-1 border">
                <NavItem to="/" label="Dashboard" />
                <NavItem to="/analytics" label="Analytics" />
              </div>

              {right}

              <button
                onClick={logout}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <div className="text-2xl font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">
            Manage shipments and track performance.
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
