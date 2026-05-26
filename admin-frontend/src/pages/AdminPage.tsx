import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../shared/api";
import type {
  Appointment, Doctor, Service, PromoCode, Review,
  AdminFinanceSummary, DoctorFinanceSummary, Expense, ClinicSettings, User
} from "../shared/types";
import { formatCurrency, formatDateTime, statusLabel, statusColor } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

type Tab = "appointments" | "finance" | "services" | "doctors" | "promo" | "reviews" | "patients" | "settings";

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as Tab) ?? "appointments";
  const [tab, setTab] = useState<Tab>(tabParam);

  const setTab2 = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "appointments", label: "Записи", icon: "📋" },
    { key: "finance", label: "Фінанси", icon: "💰" },
    { key: "services", label: "Послуги", icon: "🦷" },
    { key: "doctors", label: "Лікарі", icon: "👨‍⚕️" },
    { key: "promo", label: "Промокоди", icon: "🎫" },
    { key: "reviews", label: "Відгуки", icon: "⭐" },
    { key: "patients", label: "Пацієнти", icon: "👥" },
    { key: "settings", label: "Налаштування", icon: "⚙️" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab2(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appointments" && <AppointmentsTab />}
      {tab === "finance" && <FinanceTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "doctors" && <DoctorsTab />}
      {tab === "promo" && <PromoTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "patients" && <PatientsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

// ===================== APPOINTMENTS =====================
function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    api.get<Appointment[]>(`/appointments${q}`)
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Записи ({appointments.length})</h2>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Усі статуси</option>
          <option value="new">Нові</option>
          <option value="confirmed">Підтверджені</option>
          <option value="completed">Завершені</option>
          <option value="cancelled">Скасовані</option>
          <option value="no_show">Не з'явились</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Пацієнт</th>
              <th className="table-th">Лікар</th>
              <th className="table-th">Послуга</th>
              <th className="table-th">Дата/час</th>
              <th className="table-th">Сума</th>
              <th className="table-th">Статус</th>
              <th className="table-th">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{a.patient_name}</td>
                <td className="table-td">{a.doctor_name}</td>
                <td className="table-td">{a.service_name}</td>
                <td className="table-td text-xs">{formatDateTime(a.starts_at)}</td>
                <td className="table-td">{formatCurrency(a.final_amount)}</td>
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>
                    {statusLabel(a.status)}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    {a.status === "new" && (
                      <button onClick={() => updateStatus(a.id, "confirmed")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                        Підтвердити
                      </button>
                    )}
                    {(a.status === "new" || a.status === "confirmed") && (
                      <>
                        <button onClick={() => updateStatus(a.id, "completed")} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                          Завершити
                        </button>
                        <button onClick={() => updateStatus(a.id, "cancelled")} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                          Скасувати
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p className="text-center text-gray-400 py-8">Немає записів</p>
        )}
      </div>
    </div>
  );
}

// ===================== FINANCE =====================
function FinanceTab() {
  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [doctorsSummary, setDoctorsSummary] = useState<DoctorFinanceSummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", expense_date: "", description: "" });
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get<AdminFinanceSummary>("/finance/summary"),
      api.get<DoctorFinanceSummary[]>("/finance/doctors"),
      api.get<Expense[]>("/finance/expenses"),
    ]).then(([s, d, e]) => {
      setSummary(s.data);
      setDoctorsSummary(d.data);
      setExpenses(e.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addExpense = async () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.expense_date) return;
    await api.post("/finance/expenses", {
      ...newExpense,
      amount: parseFloat(newExpense.amount),
    });
    setNewExpense({ category: "", amount: "", expense_date: "", description: "" });
    load();
  };

  const deleteExpense = async (id: number) => {
    if (!confirm("Видалити витрату?")) return;
    await api.delete(`/finance/expenses/${id}`);
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Дохід", value: formatCurrency(summary.total_revenue), color: "text-green-600" },
            { label: "Витрати", value: formatCurrency(summary.total_expenses), color: "text-red-600" },
            { label: "Прибуток", value: formatCurrency(summary.net_profit), color: summary.net_profit >= 0 ? "text-blue-600" : "text-red-600" },
            { label: "Виплати лікарям", value: formatCurrency(summary.doctor_payouts), color: "text-purple-600" },
          ].map((card) => (
            <div key={card.label} className="card">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Doctor payouts */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Виплати лікарям</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Лікар</th>
              <th className="table-th">Завершено</th>
              <th className="table-th">Оплачено</th>
              <th className="table-th">Дохід</th>
              <th className="table-th">Виплата</th>
            </tr>
          </thead>
          <tbody>
            {doctorsSummary.map((d) => (
              <tr key={d.doctor_id} className="border-b border-gray-50">
                <td className="table-td font-medium">{d.doctor_name}</td>
                <td className="table-td">{d.completed_appointments}</td>
                <td className="table-td">{d.paid_appointments}</td>
                <td className="table-td">{formatCurrency(d.gross_revenue)}</td>
                <td className="table-td font-semibold text-purple-600">{formatCurrency(d.payout_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Витрати</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <input className="input" placeholder="Категорія" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} />
          <input className="input" placeholder="Сума" type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
          <input className="input" type="date" value={newExpense.expense_date} onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })} />
          <button onClick={addExpense} className="btn-primary">Додати</button>
        </div>
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <span className="font-medium text-sm">{e.category}</span>
                <span className="text-gray-400 text-xs ml-2">{e.expense_date}</span>
                {e.description && <span className="text-gray-400 text-xs ml-2">— {e.description}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-red-600">{formatCurrency(e.amount)}</span>
                <button onClick={() => deleteExpense(e.id)} className="text-gray-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Витрат немає</p>}
        </div>
      </div>
    </div>
  );
}

// ===================== SERVICES =====================
function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: "", category: "", description: "", duration_minutes: "30", price: "", is_active: true });
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<Service[]>("/services/all").then((r) => setServices(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.price) return;
    await api.post("/services", { ...form, category: form.category || null, duration_minutes: parseInt(form.duration_minutes), price: parseFloat(form.price) });
    setForm({ name: "", category: "", description: "", duration_minutes: "30", price: "", is_active: true });
    load();
  };

  const toggle = async (svc: Service) => {
    await api.patch(`/services/${svc.id}`, { is_active: !svc.is_active });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Видалити послугу?")) return;
    await api.delete(`/services/${id}`);
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Послуги</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <input className="input" placeholder="Назва*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Категорія" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="input" placeholder="Опис" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Тривалість (хв)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
        <input className="input" placeholder="Ціна (грн)*" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <button onClick={create} className="btn-primary">Додати</button>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="table-th">Назва</th>
            <th className="table-th">Категорія</th>
            <th className="table-th">Тривалість</th>
            <th className="table-th">Ціна</th>
            <th className="table-th">Статус</th>
            <th className="table-th">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {services.map((svc) => (
            <tr key={svc.id}>
              <td className="table-td">
                <p className="font-medium">{svc.name}</p>
                {svc.description && <p className="text-xs text-gray-400">{svc.description}</p>}
              </td>
              <td className="table-td">
                {svc.category && <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{svc.category}</span>}
              </td>
              <td className="table-td">{svc.duration_minutes} хв</td>
              <td className="table-td">{formatCurrency(svc.price)}</td>
              <td className="table-td">
                <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {svc.is_active ? "Активна" : "Вимкнена"}
                </span>
              </td>
              <td className="table-td">
                <div className="flex gap-2">
                  <button onClick={() => toggle(svc)} className="text-xs text-blue-600 hover:underline">
                    {svc.is_active ? "Вимкнути" : "Увімкнути"}
                  </button>
                  <button onClick={() => del(svc.id)} className="text-xs text-red-500 hover:underline">Видалити</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===================== DOCTORS =====================
function DoctorsTab() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "", password: "", full_name: "", title: "Стоматолог",
    phone: "", email: "", bio: "", commission_percent: "40",
  });

  const load = () => {
    Promise.all([
      api.get<Doctor[]>("/doctors?include_inactive=true"),
      api.get<Service[]>("/services/all"),
    ]).then(([d, s]) => {
      setDoctors(d.data);
      setServices(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.username || !form.password || !form.full_name) return;
    await api.post("/doctors", {
      ...form,
      commission_percent: parseFloat(form.commission_percent) || null,
      is_active: true,
    });
    setShowForm(false);
    setForm({ username: "", password: "", full_name: "", title: "Стоматолог", phone: "", email: "", bio: "", commission_percent: "40" });
    load();
  };

  const toggleActive = async (doc: Doctor) => {
    await api.patch(`/doctors/${doc.id}`, { is_active: !doc.is_active });
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Лікарі ({doctors.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Скасувати" : "+ Додати лікаря"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Новий лікар</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Логін*</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="label">Пароль*</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Повне ім'я*</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Посада</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Комісія (%)</label>
              <input className="input" type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} />
            </div>
            <div>
              <label className="label">Біо</label>
              <input className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <button onClick={create} className="btn-primary mt-4">Створити лікаря</button>
        </div>
      )}

      <div className="grid gap-4">
        {doctors.map((doc) => (
          <div key={doc.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
              {doc.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{doc.full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${doc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {doc.is_active ? "Активний" : "Неактивний"}
                </span>
              </div>
              <p className="text-sm text-blue-600">{doc.title}</p>
              <p className="text-xs text-gray-400">
                Послуги: {doc.services.length} | Рейтинг: {doc.rating.toFixed(1)}
                {doc.commission_percent && ` | Комісія: ${doc.commission_percent}%`}
              </p>
            </div>
            <button onClick={() => toggleActive(doc)} className="btn-secondary text-xs">
              {doc.is_active ? "Деактивувати" : "Активувати"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== PROMO CODES =====================
function PromoTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", expires_at: "", usage_limit: "" });
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<PromoCode[]>("/promo-codes").then((r) => setPromos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.discount_value) return;
    await api.post("/promo-codes", {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      expires_at: form.expires_at || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: true,
    });
    setForm({ code: "", discount_type: "percent", discount_value: "", expires_at: "", usage_limit: "" });
    load();
  };

  const toggle = async (p: PromoCode) => {
    await api.patch(`/promo-codes/${p.id}`, { is_active: !p.is_active });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Видалити промокод?")) return;
    await api.delete(`/promo-codes/${id}`);
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Промокоди</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <input className="input" placeholder="Код (напр. SAVE10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
          <option value="percent">Відсоток</option>
          <option value="fixed">Фіксована сума</option>
        </select>
        <input className="input" placeholder="Розмір знижки" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
        <input className="input" type="date" placeholder="Дата закінчення" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        <button onClick={create} className="btn-primary">Додати</button>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="table-th">Код</th>
            <th className="table-th">Знижка</th>
            <th className="table-th">Використань</th>
            <th className="table-th">Закінчується</th>
            <th className="table-th">Статус</th>
            <th className="table-th">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {promos.map((p) => (
            <tr key={p.id}>
              <td className="table-td font-mono font-bold text-blue-700">{p.code}</td>
              <td className="table-td">
                {p.discount_type === "percent" ? `${p.discount_value}%` : formatCurrency(p.discount_value)}
              </td>
              <td className="table-td">
                {p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}
              </td>
              <td className="table-td text-xs">{p.expires_at ?? "—"}</td>
              <td className="table-td">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.is_active ? "Активний" : "Вимкнений"}
                </span>
              </td>
              <td className="table-td">
                <div className="flex gap-2">
                  <button onClick={() => toggle(p)} className="text-xs text-blue-600 hover:underline">
                    {p.is_active ? "Вимкнути" : "Увімкнути"}
                  </button>
                  <button onClick={() => del(p.id)} className="text-xs text-red-500 hover:underline">Видалити</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===================== REVIEWS =====================
function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = () => {
    const q = filter ? `?moderation_status=${filter}` : "";
    api.get<Review[]>(`/reviews${q}`).then((r) => setReviews(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const moderate = async (id: number, status: string) => {
    await api.patch(`/reviews/${id}/moderate`, { moderation_status: status });
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Відгуки</h2>
        <div className="flex gap-2">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "pending" ? "Очікують" : s === "approved" ? "Схвалені" : "Відхилені"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{r.patient_name}</p>
                <p className="text-xs text-gray-400">Лікар: {r.doctor_name} • {r.service_name}</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-4 h-4 ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">{formatDateTime(r.created_at)}</p>
            </div>
            {r.comment && <p className="text-sm text-gray-600 mb-3">{r.comment}</p>}
            {r.moderation_status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => moderate(r.id, "approved")} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">
                  Схвалити
                </button>
                <button onClick={() => moderate(r.id, "rejected")} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">
                  Відхилити
                </button>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-gray-400 py-8">Немає відгуків</p>}
      </div>
    </div>
  );
}

// ===================== PATIENTS =====================
function PatientsTab() {
  const [patients, setPatients] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>("/patients").then((r) => setPatients(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card md:col-span-1">
        <h2 className="text-lg font-semibold mb-4">Пацієнти ({patients.length})</h2>
        <div className="space-y-2">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                selected?.id === p.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
              }`}
            >
              <p className="font-medium text-sm">{p.full_name}</p>
              <p className="text-xs text-gray-400">@{p.username}</p>
            </button>
          ))}
          {patients.length === 0 && <p className="text-gray-400 text-sm">Пацієнтів немає</p>}
        </div>
      </div>

      <div className="md:col-span-2">
        {selected ? (
          <PatientDetail patient={selected} />
        ) : (
          <div className="card flex items-center justify-center h-full min-h-[200px] text-gray-400">
            Оберіть пацієнта для перегляду
          </div>
        )}
      </div>
    </div>
  );
}

function PatientDetail({ patient }: { patient: User }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<Appointment[]>(`/appointments?patient_id=${patient.id}`)
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  }, [patient.id]);

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-2">{patient.full_name}</h3>
        <p className="text-sm text-gray-500">Логін: @{patient.username}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${patient.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {patient.is_active ? "Активний" : "Неактивний"}
        </span>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Записи пацієнта</h3>
        {loading ? <LoadingBlock /> : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.service_name}</p>
                  <p className="text-xs text-gray-400">{a.doctor_name} • {formatDateTime(a.starts_at)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(a.status)}`}>
                    {statusLabel(a.status)}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(a.final_amount)}</p>
                </div>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Записів немає</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== SETTINGS =====================
const SOCIAL_NETWORKS = [
  {
    key: "instagram_url" as const,
    label: "Instagram",
    placeholder: "https://instagram.com/dentacare",
    color: "text-pink-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    key: "telegram_url" as const,
    label: "Telegram",
    placeholder: "https://t.me/dentacare",
    color: "text-sky-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    key: "facebook_url" as const,
    label: "Facebook",
    placeholder: "https://facebook.com/dentacare",
    color: "text-blue-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: "youtube_url" as const,
    label: "YouTube",
    placeholder: "https://youtube.com/@dentacare",
    color: "text-red-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    key: "tiktok_url" as const,
    label: "TikTok",
    placeholder: "https://tiktok.com/@dentacare",
    color: "text-gray-800",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  {
    key: "twitter_url" as const,
    label: "X / Twitter",
    placeholder: "https://x.com/dentacare",
    color: "text-gray-900",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: "viber_url" as const,
    label: "Viber",
    placeholder: "viber://chat?number=%2B380441234567",
    color: "text-violet-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.187.541 6.749.46 9.927c-.08 3.178-.185 9.14 5.604 10.712h.004l-.004 2.454s-.037.993.617 1.196c.79.245 1.255-.508 2.01-1.327.415-.45.988-1.112 1.42-1.617 3.915.33 6.925-.422 7.27-.537.796-.266 5.301-.838 6.036-6.834.758-6.185-.364-10.08-2.39-11.836l.002-.001C19.548.759 16.132.092 12.344.012c0 0-.453-.015-0.946-.01zM11.42 1.27c.453-.005.862.008.862.008 3.426.07 6.563.631 7.88 1.785 1.753 1.52 2.782 5.054 2.1 10.505-.638 5.198-4.476 5.596-5.156 5.823-.287.095-2.931.754-6.35.53 0 0-2.514 3.036-3.301 3.827-.123.124-.267.18-.363.155-.135-.035-.172-.198-.17-.436l.03-4.2c0-.004 0-.004 0 0-5.038-1.36-4.748-6.502-4.68-9.32.067-2.818.7-5.074 2.184-6.55 2-1.833 5.725-2.11 7.502-2.13z"/>
      </svg>
    ),
  },
  {
    key: "whatsapp_url" as const,
    label: "WhatsApp",
    placeholder: "https://wa.me/380441234567",
    color: "text-green-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    key: "linkedin_url" as const,
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/dentacare",
    color: "text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

function SettingsTab() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [form, setForm] = useState<Partial<ClinicSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<ClinicSettings>("/clinic-settings").then((r) => {
      setSettings(r.data);
      setForm(r.data);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put<ClinicSettings>("/clinic-settings", form);
      setSettings(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <LoadingBlock />;

  const field = (key: keyof ClinicSettings, label: string, placeholder?: string) => (
    <div key={key}>
      <label className="label">{label}</label>
      <input
        className="input"
        placeholder={placeholder}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* General */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Загальна інформація</h2>
        <div className="grid grid-cols-1 gap-4">
          {field("brand_name", "Назва клініки", "DentaCare")}
          {field("tagline", "Слоган", "Ваша посмішка — наша турбота")}
          {field("address", "Адреса", "вул. Хрещатик, 1, Київ")}
          {field("phone", "Телефон", "+380 44 123 45 67")}
          {field("email", "Email", "info@dentacare.ua")}
          {field("working_hours_note", "Графік роботи", "Пн–Пт: 09:00–19:00")}
          <div>
            <label className="label">Про клініку</label>
            <textarea
              className="input"
              rows={4}
              value={(form.about_text as string) ?? ""}
              onChange={(e) => setForm({ ...form, about_text: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Social Networks */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Соціальні мережі</h2>
        <p className="text-sm text-gray-400 mb-5">Посилання відображаються на сайті у блоці контактів.</p>
        <div className="space-y-3">
          {SOCIAL_NETWORKS.map(({ key, label, placeholder, color, icon }) => (
            <div key={key} className="flex items-center gap-3">
              <span className={`flex-shrink-0 ${color}`}>{icon}</span>
              <div className="flex-1">
                <label className="sr-only">{label}</label>
                <input
                  className="input"
                  placeholder={placeholder}
                  value={(form[key] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value || null })}
                />
              </div>
              {form[key] && (
                <a
                  href={form[key] as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex-shrink-0"
                >
                  ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Збереження..." : "Зберегти"}
        </button>
        {saved && <span className="text-sm text-green-600">Збережено!</span>}
      </div>
    </div>
  );
}
