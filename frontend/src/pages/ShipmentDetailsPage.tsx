import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import AppShell from "../components/AppShell";

type ShipmentStatus = "Pending" | "InTransit" | "Delivered";

type Shipment = {
  _id: string;
  trackingNumber: string;
  customerName: string;
  status: ShipmentStatus;
  currentLocation: string;
  eta: string;
  createdAt: string;
  updatedAt?: string;
};

function Badge({ status }: { status: ShipmentStatus }) {
  const cls =
    status === "Delivered"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "InTransit"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status === "InTransit" ? "In Transit" : status}
    </span>
  );
}

export default function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const title = useMemo(() => (shipment ? shipment.trackingNumber : "Shipment"), [shipment]);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // بما أنه ما عندك GET by id في الباك، نجيب من القائمة ونفلتر.
      // الأفضل لاحقاً: تسوي endpoint GET /api/shipments/:id
      const res = await http.get<{ items: Shipment[] }>(`/api/shipments?q=${encodeURIComponent(id)}`);
      const found = res.data.items.find((x) => x._id === id) ?? null;

      // fallback: لو البحث ما رجّع، جيب صفحة أولى بدون q
      if (!found) {
        const res2 = await http.get<{ items: Shipment[] }>(`/api/shipments?page=1&pageSize=50`);
        const found2 = res2.data.items.find((x) => x._id === id) ?? null;
        setShipment(found2);
        if (!found2) setError("Shipment not found.");
      } else {
        setShipment(found);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load shipment");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(newStatus: ShipmentStatus) {
    if (!id) return;
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await http.patch(`/api/shipments/${id}/status`, { status: newStatus });
      setSuccessMsg("Status updated.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    setError(null);
    setSuccessMsg(null);

    const ok = confirm("Delete this shipment? This cannot be undone.");
    if (!ok) return;

    setBusy(true);
    try {
      await http.delete(`/api/shipments/${id}`);
      nav("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title={title}
      right={
        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            onClick={load}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading...</div>
      ) : !shipment ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
          {error ?? "Shipment not found."}
        </div>
      ) : (
        <>
          {/* Header card */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Tracking</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{shipment.trackingNumber}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge status={shipment.status} />
                  <span className="text-xs text-slate-500">
                    Created:{" "}
                    {new Date(shipment.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() => updateStatus("Pending")}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Mark Pending
                </button>
                <button
                  disabled={busy}
                  onClick={() => updateStatus("InTransit")}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Mark In Transit
                </button>
                <button
                  disabled={busy}
                  onClick={() => updateStatus("Delivered")}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Mark Delivered
                </button>
                <button
                  disabled={busy}
                  onClick={remove}
                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Details grid */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-xs font-medium text-slate-500">Customer</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{shipment.customerName}</div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-xs font-medium text-slate-500">Current location</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{shipment.currentLocation}</div>
            </div>

            <div className="rounded-2xl border bg-white p-5 md:col-span-2">
              <div className="text-xs font-medium text-slate-500">ETA</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {new Date(shipment.eta).toLocaleString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="mt-1 text-xs text-slate-500">Stored as ISO in the database.</div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
