import { useEffect, useState } from "react";
import { api } from "../shared/api";
import { useAuth } from "../features/auth/AuthProvider";
import type { Doctor, Service } from "../shared/types";
import { WEEKDAYS } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: "", title: "", phone: "", email: "", bio: "" });

  const load = () => {
    Promise.all([
      api.get<Doctor[]>("/doctors"),
      api.get<Service[]>("/services"),
    ]).then(([d, s]) => {
      const myDoc = d.data.find((doc) => doc.user_id === user?.id);
      if (myDoc) {
        setDoctor(myDoc);
        setForm({
          full_name: myDoc.full_name,
          title: myDoc.title,
          phone: myDoc.phone ?? "",
          email: myDoc.email ?? "",
          bio: myDoc.bio ?? "",
        });
      }
      setAllServices(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await api.patch(`/doctors/${doctor.id}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!doctor || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    await api.post(`/doctors/${doctor.id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    load();
  };

  if (loading) return <LoadingBlock />;
  if (!doctor) return <div className="text-center text-gray-400 py-20">Профіль не знайдено</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Мій профіль</h1>

      {/* Photo */}
      <div className="card flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-blue-600">{doctor.full_name.charAt(0)}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{doctor.full_name}</p>
          <p className="text-sm text-blue-600 mb-2">{doctor.title}</p>
          <label className="btn-secondary cursor-pointer text-xs">
            Змінити фото
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </label>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h2 className="font-semibold mb-4">Особисті дані</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Повне ім'я</label>
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
          <div className="col-span-2">
            <label className="label">Біографія</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Збереження..." : "Зберегти"}
          </button>
          {saved && <span className="text-sm text-green-600">Збережено!</span>}
        </div>
      </div>

      {/* Services */}
      <div className="card">
        <h2 className="font-semibold mb-4">Мої послуги</h2>
        {doctor.services.length === 0 ? (
          <p className="text-gray-400 text-sm">Послуги не призначені</p>
        ) : (
          <div className="space-y-2">
            {doctor.services.map(({ service, custom_price }) => (
              <div key={service.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-gray-400">{service.duration_minutes} хв</p>
                </div>
                <p className="text-sm font-semibold text-blue-600">
                  {custom_price ?? service.price} грн
                  {custom_price && <span className="text-xs text-gray-400 ml-1">(індивідуальна)</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="card">
        <h2 className="font-semibold mb-4">Графік роботи</h2>
        {doctor.schedules.length === 0 ? (
          <p className="text-gray-400 text-sm">Графік не встановлено</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {doctor.schedules.map((s) => (
              <div key={s.id} className="bg-blue-50 rounded-lg p-3">
                <p className="font-semibold text-blue-700 text-sm">{WEEKDAYS[s.weekday]}</p>
                <p className="text-xs text-gray-600">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                {s.break_start && (
                  <p className="text-xs text-gray-400">обід: {s.break_start.slice(0, 5)}–{s.break_end?.slice(0, 5)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
