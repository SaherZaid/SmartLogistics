import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { http } from "../api/http";

type Stats = {
  Pending: number;
  InTransit: number;
  Delivered: number;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-sm font-bold text-slate-900">{value}</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">{pct}% of max</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Stats>("/api/shipments/stats");
      setStats(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => {
    if (!stats) return 0;
    return (stats.Pending ?? 0) + (stats.InTransit ?? 0) + (stats.Delivered ?? 0);
  }, [stats]);

  const max = useMemo(() => {
    if (!stats) return 0;
    return Math.max(stats.Pending ?? 0, stats.InTransit ?? 0, stats.Delivered ?? 0);
  }, [stats]);

  const deliveredRate = total === 0 ? 0 : Math.round((stats!.Delivered / total) * 100);

  return (
    <AppShell
      title="Analytics"
      right={
        <button
          onClick={load}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading analytics...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : !stats ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No data.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <StatCard label="Total shipments" value={total} />
            <StatCard label="Pending" value={stats.Pending} />
            <StatCard label="In Transit" value={stats.InTransit} />
            <StatCard label="Delivered" value={stats.Delivered} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <BarRow label="Pending" value={stats.Pending} max={max} />
            <BarRow label="In Transit" value={stats.InTransit} max={max} />
            <BarRow label="Delivered" value={stats.Delivered} max={max} />
          </div>

          <div className="mt-4 rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">Key insights</div>
            <div className="mt-2 text-sm text-slate-600">
              Delivery rate: <span className="font-semibold text-slate-900">{deliveredRate}%</span>
              <span className="text-slate-400"> · </span>
              Best practice: keep Pending low and In Transit flowing.
            </div>
            <div className="mt-1 text-xs text-slate-500">Numbers are calculated in the backend (stats endpoint).</div>
          </div>
        </>
      )}
    </AppShell>
  );
}
