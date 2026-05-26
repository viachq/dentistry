import { useEffect, useState } from "react";
import { api } from "../shared/api";
import { useAuth } from "../features/auth/AuthProvider";
import type { Appointment, Doctor, Review, Service, AvailableSlot, PatientCard, Notification } from "../shared/types";
import { formatCurrency, formatDateTime, statusLabel, statusColor } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

type Tab = "appointments" | "book" | "card" | "profile" | "notifications";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg
            className={`w-7 h-7 transition-colors ${s <= (hovered || value) ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function PatientPage() {
  const { user, changePassword, updateProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [openReviewId, setOpenReviewId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [submittedApptIds, setSubmittedApptIds] = useState<Set<number>>(new Set());

  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Patient card
  const [card, setCard] = useState<PatientCard | null>(null);
  const [cardForm, setCardForm] = useState({ blood_type: "", allergies: "", chronic_conditions: "", general_notes: "" });
  const [cardSaving, setCardSaving] = useState(false);

  // Profile
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Change password
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  // Notifications tab
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Appointment[]>("/appointments/patient/me"),
      api.get<Doctor[]>("/doctors"),
      api.get<Service[]>("/services"),
      api.get<Review[]>("/reviews/my"),
    ])
      .then(([a, d, s, r]) => {
        setAppointments(a.data);
        setDoctors(d.data);
        setServices(s.data);
        setMyReviews(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "card") {
      api.get<PatientCard>("/patients/me/card")
        .then((r) => {
          setCard(r.data);
          setCardForm({
            blood_type: r.data.blood_type ?? "",
            allergies: r.data.allergies ?? "",
            chronic_conditions: r.data.chronic_conditions ?? "",
            general_notes: r.data.general_notes ?? "",
          });
        })
        .catch(() => {});
    }
    if (tab === "notifications") {
      setNotifLoading(true);
      api.get<Notification[]>("/notifications")
        .then((r) => setNotifications(r.data))
        .catch(() => {})
        .finally(() => setNotifLoading(false));
    }
    if (tab === "profile" && user) {
      setProfileForm({ full_name: user.full_name, phone: user.phone ?? "", email: user.email ?? "" });
    }
  }, [tab]);

  const availableServices = selectedDoctor
    ? selectedDoctor.services.map((ds) => ({ ...ds.service, price: ds.custom_price ?? ds.service.price }))
    : services;

  useEffect(() => {
    if (selectedDoctor && selectedService && selectedDate) {
      api
        .get<{ slots: AvailableSlot[] }>(
          `/appointments/available-slots?doctor_id=${selectedDoctor.id}&service_id=${selectedService.id}&date=${selectedDate}`
        )
        .then((r) => setSlots(r.data.slots))
        .catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
    setSelectedSlot(null);
  }, [selectedDoctor, selectedService, selectedDate]);

  const reviewedApptIds = new Set(myReviews.map((r) => r.appointment_id));

  const handleSubmitReview = async (apptId: number) => {
    setReviewSubmitting(true);
    try {
      await api.post("/reviews", {
        appointment_id: apptId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setSubmittedApptIds((prev) => new Set([...prev, apptId]));
      setOpenReviewId(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      alert(err.response?.data?.detail ?? "Помилка при відправці відгуку");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      await updateProfile({
        full_name: profileForm.full_name || undefined,
        phone: profileForm.phone || undefined,
        email: profileForm.email || undefined,
      });
      setProfileSuccess("Профіль збережено!");
    } catch (err: any) {
      setProfileError(err.response?.data?.detail ?? "Помилка збереження профілю");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwSuccess("");
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setPwError("Паролі не збігаються");
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError("Новий пароль має містити не менше 6 символів");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.current_password, pwForm.new_password);
      setPwSuccess("Пароль успішно змінено!");
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (err: any) {
      setPwError(err.response?.data?.detail ?? "Помилка зміни паролю");
    } finally {
      setPwSaving(false);
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // ignore
    }
  };

  const handleMarkAllNotifRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const formatNotifDate = (iso: string) =>
    new Date(iso).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleBook = async () => {
    if (!selectedDoctor || !selectedService || !selectedSlot) return;
    setBookingLoading(true);
    setBookingError("");
    try {
      await api.post("/appointments", {
        doctor_id: selectedDoctor.id,
        service_id: selectedService.id,
        starts_at: selectedSlot.starts_at,
        notes: notes || undefined,
        promo_code: promoCode || undefined,
        payment_method: "offline",
      });
      const r = await api.get<Appointment[]>("/appointments/patient/me");
      setAppointments(r.data);
      setBookingSuccess(true);
      setTab("appointments");
    } catch (err: any) {
      setBookingError(err.response?.data?.detail ?? "Помилка бронювання");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Скасувати запис?")) return;
    await api.patch(`/appointments/${id}/status`, { status: "cancelled" });
    const r = await api.get<Appointment[]>("/appointments/patient/me");
    setAppointments(r.data);
  };

  const handleSaveCard = async () => {
    setCardSaving(true);
    try {
      const r = await api.patch<PatientCard>("/patients/me/card", cardForm);
      setCard(r.data);
      alert("Картку збережено!");
    } catch {
      alert("Помилка збереження");
    } finally {
      setCardSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Привіт, {user?.full_name}!</h1>
        <p className="text-gray-500">Ваш особистий кабінет пацієнта</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(["appointments", "book", "card", "profile", "notifications"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setBookingSuccess(false); setBookingError(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "appointments" ? "Мої записи"
              : t === "book" ? "Записатися"
              : t === "card" ? "Моя картка"
              : t === "profile" ? "Профіль"
              : "Мої сповіщення"}
          </button>
        ))}
      </div>

      {/* Appointments */}
      {tab === "appointments" && (
        <div>
          {bookingSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              Запис успішно створено!
            </div>
          )}
          {appointments.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">У вас ще немає записів</p>
              <button onClick={() => setTab("book")} className="btn-primary">Записатися</button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => {
                const hasReview = reviewedApptIds.has(appt.id) || submittedApptIds.has(appt.id);
                const isReviewOpen = openReviewId === appt.id;
                const justSubmitted = submittedApptIds.has(appt.id);

                return (
                  <div key={appt.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(appt.status)}`}>
                            {statusLabel(appt.status)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{appt.service_name}</h3>
                        <p className="text-sm text-gray-500">Лікар: {appt.doctor_name}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(appt.starts_at)}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {formatCurrency(appt.final_amount)}
                          {appt.discount_amount > 0 && (
                            <span className="text-green-600 text-xs ml-2">
                              -знижка {formatCurrency(appt.discount_amount)}
                            </span>
                          )}
                        </p>
                      </div>
                      {(appt.status === "new" || appt.status === "confirmed") && (
                        <button onClick={() => handleCancel(appt.id)} className="text-sm text-red-500 hover:text-red-700">
                          Скасувати
                        </button>
                      )}
                    </div>

                    {/* Review block — only for completed appointments */}
                    {appt.status === "completed" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {justSubmitted ? (
                          <p className="text-sm text-green-600 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Відгук відправлено на модерацію. Дякуємо!
                          </p>
                        ) : hasReview ? (
                          <p className="text-sm text-gray-400">Ви вже залишили відгук про цей прийом</p>
                        ) : isReviewOpen ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Ваша оцінка:</p>
                            <StarPicker value={reviewRating} onChange={setReviewRating} />
                            <textarea
                              className="input text-sm"
                              rows={3}
                              placeholder="Розкажіть про свій досвід (необов'язково)..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitReview(appt.id)}
                                disabled={reviewSubmitting}
                                className="btn-primary text-sm py-1.5 px-4"
                              >
                                {reviewSubmitting ? "Відправляємо..." : "Відправити відгук"}
                              </button>
                              <button
                                onClick={() => setOpenReviewId(null)}
                                className="text-sm text-gray-400 hover:text-gray-600"
                              >
                                Скасувати
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setOpenReviewId(appt.id); setReviewRating(5); setReviewComment(""); }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Залишити відгук
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Book */}
      {tab === "book" && (
        <div className="card max-w-xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Онлайн-запис</h2>
          {bookingError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {bookingError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="label">Лікар</label>
              <select className="input" value={selectedDoctor?.id ?? ""} onChange={(e) => { const doc = doctors.find((d) => d.id === Number(e.target.value)) ?? null; setSelectedDoctor(doc); setSelectedService(null); }}>
                <option value="">Оберіть лікаря</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name} — {d.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Послуга</label>
              <select className="input" value={selectedService?.id ?? ""} onChange={(e) => { const svc = availableServices.find((s) => s.id === Number(e.target.value)) ?? null; setSelectedService(svc); }} disabled={!selectedDoctor}>
                <option value="">Оберіть послугу</option>
                {availableServices.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)} ({s.duration_minutes} хв)</option>)}
              </select>
            </div>
            <div>
              <label className="label">Дата</label>
              <input type="date" className="input" min={today} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} disabled={!selectedService} />
            </div>
            {slots.length > 0 && (
              <div>
                <label className="label">Час</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const time = new Date(slot.starts_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button key={slot.starts_at} onClick={() => setSelectedSlot(slot)} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${selectedSlot?.starts_at === slot.starts_at ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"}`}>
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedDate && selectedService && slots.length === 0 && <p className="text-sm text-gray-400">Немає вільних слотів на цю дату</p>}
            <div>
              <label className="label">Промокод (необов'язково)</label>
              <input className="input" placeholder="PROMO2026" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            </div>
            <div>
              <label className="label">Коментар (необов'язково)</label>
              <textarea className="input" rows={2} placeholder="Скарги, побажання..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button onClick={handleBook} disabled={!selectedSlot || bookingLoading} className="btn-primary w-full py-3">
              {bookingLoading ? "Зачекайте..." : "Підтвердити запис"}
            </button>
          </div>
        </div>
      )}

      {/* Patient Card */}
      {tab === "card" && (
        <div className="card max-w-xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Моя медична картка</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Група крові</label>
              <select className="input" value={cardForm.blood_type} onChange={(e) => setCardForm({ ...cardForm, blood_type: e.target.value })}>
                <option value="">Не вказано</option>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Алергії</label>
              <textarea className="input" rows={2} placeholder="Алергії на препарати, матеріали..." value={cardForm.allergies} onChange={(e) => setCardForm({ ...cardForm, allergies: e.target.value })} />
            </div>
            <div>
              <label className="label">Хронічні захворювання</label>
              <textarea className="input" rows={2} placeholder="Цукровий діабет, гіпертонія..." value={cardForm.chronic_conditions} onChange={(e) => setCardForm({ ...cardForm, chronic_conditions: e.target.value })} />
            </div>
            <div>
              <label className="label">Додаткові відомості</label>
              <textarea className="input" rows={2} value={cardForm.general_notes} onChange={(e) => setCardForm({ ...cardForm, general_notes: e.target.value })} />
            </div>
            <button onClick={handleSaveCard} disabled={cardSaving} className="btn-primary w-full py-3">
              {cardSaving ? "Збереження..." : "Зберегти картку"}
            </button>
          </div>
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div className="space-y-6 max-w-xl">
          {/* Edit profile section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Редагувати профіль</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Повне ім'я</label>
                <input
                  className="input"
                  placeholder="Іван Петренко"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Телефон</label>
                <input
                  className="input"
                  placeholder="+380501234567"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="example@email.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {profileError}
                </div>
              )}
              <button onClick={handleSaveProfile} disabled={profileSaving} className="btn-primary w-full py-3">
                {profileSaving ? "Збереження..." : "Зберегти профіль"}
              </button>
            </div>
          </div>

          {/* Change password section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Змінити пароль</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Поточний пароль</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Новий пароль</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Підтвердіть новий пароль</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={pwForm.confirm_new_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_new_password: e.target.value })}
                />
              </div>
              {pwSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {pwSuccess}
                </div>
              )}
              {pwError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {pwError}
                </div>
              )}
              <button onClick={handleChangePassword} disabled={pwSaving} className="btn-primary w-full py-3">
                {pwSaving ? "Збереження..." : "Змінити пароль"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Мої сповіщення</h2>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllNotifRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Позначити всі як прочитані
              </button>
            )}
          </div>
          {notifLoading ? (
            <LoadingBlock />
          ) : notifications.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">Немає сповіщень</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`card cursor-pointer transition-colors ${n.is_read ? "opacity-70" : "border-blue-200 bg-blue-50"}`}
                  onClick={() => !n.is_read && handleMarkNotifRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    {!n.is_read && (
                      <span className="mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                    <div className={!n.is_read ? "" : "pl-5"}>
                      <p className="font-medium text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatNotifDate(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
