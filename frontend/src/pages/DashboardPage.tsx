import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
};

type PagedResult = {
  items: Shipment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

function formatForDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function toISOFromDatetimeLocal(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function DashboardPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");

  // Create form (trackingNumber is auto-generated on backend)
  const [customerName, setCustomerName] = useState("Stena Line");
  const [currentLocation, setCurrentLocation] = useState("Gothenburg");

  const [etaLocal, setEtaLocal] = useState(() => {
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    return formatForDatetimeLocal(in2Days);
  });

  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [status, q]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<PagedResult>(`/api/shipments?${queryString}`);
      setItems(res.data.items);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function logout() {
    localStorage.removeItem("token");
    nav("/login");
  }

  function validateCreate() {
    if (!customerName.trim()) return "Customer name is required.";
    if (customerName.trim().length < 2) return "Customer name must be at least 2 characters.";
    if (!currentLocation.trim()) return "Current location is required.";
    if (!etaLocal.trim()) return "ETA is required.";
    const iso = toISOFromDatetimeLocal(etaLocal);
    if (!iso) return "ETA is invalid. Please pick a valid date/time.";
    return null;
  }

  async function createShipment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validation = validateCreate();
    if (validation) {
      setError(validation);
      return;
    }

    const etaISO = toISOFromDatetimeLocal(etaLocal)!;

    setCreating(true);
    try {
      const created = await http.post<Shipment>("/api/shipments", {
        customerName: customerName.trim(),
        currentLocation: currentLocation.trim(),
        eta: etaISO,
      });

      setSuccessMsg(`Shipment created: ${created.data.trackingNumber}`);

      setCustomerName("");
      setCurrentLocation("");
      const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      setEtaLocal(formatForDatetimeLocal(in2Days));

      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function setStatusFor(id: string, newStatus: ShipmentStatus) {
    setError(null);
    setSuccessMsg(null);
    try {
      await http.patch(`/api/shipments/${id}/status`, { status: newStatus });
      setSuccessMsg("Status updated.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Update failed");
    }
  }

  async function deleteShipment(id: string) {
    setError(null);
    setSuccessMsg(null);

    const ok = confirm("Delete this shipment? This cannot be undone.");
    if (!ok) return;

    try {
      await http.delete(`/api/shipments/${id}`);
      setSuccessMsg("Shipment deleted.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Delete failed");
    }
  }

  const pendingCount = items.filter((x) => x.status === "Pending").length;
  const inTransitCount = items.filter((x) => x.status === "InTransit").length;
  const deliveredCount = items.filter((x) => x.status === "Delivered").length;

  return (
    <AppShell
      title="Dashboard"
      right={
        <>
          <button
            onClick={load}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            onClick={logout}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">Pending</div>
          <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">In Transit</div>
          <div className="mt-1 text-2xl font-bold">{inTransitCount}</div>
        </div>
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">Delivered</div>
          <div className="mt-1 text-2xl font-bold">{deliveredCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">Search</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            placeholder="Tracking number, customer, or location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="InTransit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={load}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Create */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Create shipment</h3>
          <span className="text-xs text-slate-500">Tracking number is generated automatically</span>
        </div>

        <form onSubmit={createShipment} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Customer</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Stena Line"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Current location</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="e.g. Gothenburg"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">ETA</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              value={etaLocal}
              onChange={(e) => setEtaLocal(e.target.value)}
            />
            <div className="mt-1 text-xs text-slate-500">We convert it to ISO automatically for the API.</div>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              disabled={creating}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                creating ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {creating ? "Creating..." : "Add shipment"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerName("");
                setCurrentLocation("");
                const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                setEtaLocal(formatForDatetimeLocal(in2Days));
                setError(null);
                setSuccessMsg(null);
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>
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

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-2xl border">
        <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Shipments</div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No shipments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white text-slate-500">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Tracking</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">ETA</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {items.map((s) => (
                  <tr key={s._id} className="border-b last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/shipments/${s._id}`}
                        className="font-semibold text-slate-900 hover:underline"
                        title="Open shipment details"
                      >
                        {s.trackingNumber}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{s.customerName}</td>
                    <td className="px-4 py-3">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.currentLocation}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(s.eta).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => setStatusFor(s._id, "Pending")}
                          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => setStatusFor(s._id, "InTransit")}
                          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          In Transit
                        </button>
                        <button
                          onClick={() => setStatusFor(s._id, "Delivered")}
                          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => deleteShipment(s._id)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
