import { useEffect, useState } from "react";
import { api } from "../shared/api";
import { useAuth } from "../features/auth/AuthProvider";
import type { Appointment, Doctor } from "../shared/types";
import { formatCurrency, formatDateTime, statusLabel, statusColor } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

export default function DoctorPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("new,confirmed");

  const load = () => {
    Promise.all([
      api.get<Appointment[]>("/appointments"),
      api.get<Doctor[]>("/doctors"),
    ]).then(([a, d]) => {
      setAppointments(a.data);
      const myDoc = d.data.find((doc) => doc.user_id === user?.id);
      setDoctor(myDoc ?? null);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  };

  if (loading) return <LoadingBlock />;

  const filtered = appointments.filter((a) =>
    statusFilter === "all" ? true : statusFilter.split(",").includes(a.status)
  );

  const today = new Date().toDateString();
  const todayAppts = filtered.filter((a) => new Date(a.starts_at).toDateString() === today);
  const upcoming = filtered.filter((a) => new Date(a.starts_at).toDateString() !== today && new Date(a.starts_at) > new Date());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Привіт, {user?.full_name}!</h1>
        {doctor && (
          <p className="text-gray-500 text-sm">{doctor.title} • Рейтинг: {doctor.rating.toFixed(1)} ⭐</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{todayAppts.length}</p>
          <p className="text-sm text-gray-500">Сьогодні</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{upcoming.length}</p>
          <p className="text-sm text-gray-500">Майбутні</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-600">{appointments.filter((a) => a.status === "completed").length}</p>
          <p className="text-sm text-gray-500">Завершено</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { value: "new,confirmed", label: "Активні" },
          { value: "completed", label: "Завершені" },
          { value: "cancelled,no_show", label: "Скасовані" },
          { value: "all", label: "Всі" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              statusFilter === f.value ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a.id} className="card flex items-center gap-4">
            <div className="text-center flex-shrink-0 w-14">
              <p className="text-xs text-gray-400">
                {new Date(a.starts_at).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" })}
              </p>
              <p className="font-bold text-gray-900">
                {new Date(a.starts_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{a.patient_name}</p>
              <p className="text-sm text-gray-500">{a.service_name}</p>
              {a.notes && <p className="text-xs text-gray-400 mt-0.5">💬 {a.notes}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium block mb-2 ${statusColor(a.status)}`}>
                {statusLabel(a.status)}
              </span>
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(a.final_amount)}</p>
            </div>
            {(a.status === "new" || a.status === "confirmed") && (
              <div className="flex flex-col gap-1">
                {a.status === "new" && (
                  <button onClick={() => updateStatus(a.id, "confirmed")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                    Підтвердити
                  </button>
                )}
                <button onClick={() => updateStatus(a.id, "completed")} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                  Завершити
                </button>
                <button onClick={() => updateStatus(a.id, "no_show")} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">
                  Не з'явився
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            Немає записів з обраним фільтром
          </div>
        )}
      </div>
    </div>
  );
}
