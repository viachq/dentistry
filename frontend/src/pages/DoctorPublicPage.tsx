import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../shared/api";
import type { Doctor, Review } from "../shared/types";
import { formatCurrency, formatDateTime, WEEKDAYS } from "../shared/format";
import StarRating from "../components/StarRating";
import { DoctorPageSkeleton } from "../components/Skeleton";

interface BeforeAfterCase {
  id: number;
  doctor_id: number;
  title: string;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  created_at: string;
}

export default function DoctorPublicPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cases, setCases] = useState<BeforeAfterCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Doctor>(`/doctors/${id}`),
      api.get<Review[]>(`/reviews?doctor_id=${id}&moderation_status=approved`),
      api.get<BeforeAfterCase[]>(`/before-after?doctor_id=${id}`),
    ])
      .then(([d, r, c]) => {
        setDoctor(d.data);
        setReviews(r.data);
        setCases(c.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DoctorPageSkeleton />;
  if (!doctor) return <div className="text-center py-20 text-gray-500">Лікаря не знайдено</div>;

  const educationLines = doctor.education?.split("\n").filter(Boolean) ?? [];
  const achievementLines = doctor.achievements?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Doctor header */}
      <div className="card mb-8 flex flex-col md:flex-row gap-6">
        <div className="w-40 h-48 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-5xl font-bold text-blue-600">{doctor.full_name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{doctor.full_name}</h1>
          <p className="text-blue-600 font-medium mb-2">{doctor.title}</p>

          {doctor.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={doctor.rating} size="md" showValue />
              <span className="text-sm text-gray-400">/ 5.0</span>
            </div>
          )}

          {doctor.experience_years != null && (
            <p className="text-sm text-gray-600 mb-2">
              Досвід роботи: <span className="font-semibold text-gray-800">{doctor.experience_years} років</span>
            </p>
          )}

          {doctor.bio && <p className="text-gray-600 text-sm leading-relaxed mb-4">{doctor.bio}</p>}

          <Link to="/login?tab=register" className="btn-primary mt-2 inline-block">
            Записатися до лікаря
          </Link>
        </div>
      </div>

      {/* Education & Achievements */}
      {(educationLines.length > 0 || achievementLines.length > 0) && (
        <div className="card mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {educationLines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Освіта</h2>
              <ul className="space-y-1.5">
                {educationLines.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {achievementLines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Досягнення</h2>
              <ul className="space-y-1.5">
                {achievementLines.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-amber-400 mt-0.5">★</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {doctor.services.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Послуги</h2>
          <div className="divide-y divide-gray-100">
            {doctor.services.map(({ service, custom_price }) => (
              <div key={service.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{service.name}</p>
                  <p className="text-xs text-gray-400">{service.duration_minutes} хв</p>
                </div>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(custom_price ?? service.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Before/After Gallery */}
      {cases.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Результати роботи</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div key={c.id} className="rounded-xl overflow-hidden border border-gray-100">
                <div className="grid grid-cols-2 gap-px bg-gray-200">
                  <div className="relative">
                    <img src={c.before_image_url} alt="До" className="w-full h-48 object-cover bg-white" />
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">До</span>
                  </div>
                  <div className="relative">
                    <img src={c.after_image_url} alt="Після" className="w-full h-48 object-cover bg-white" />
                    <span className="absolute bottom-2 left-2 bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded">Після</span>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-medium text-gray-900 text-sm">{c.title}</h3>
                  {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      {doctor.schedules.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Графік роботи</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {doctor.schedules.map((s) => (
              <div key={s.id} className="bg-blue-50 rounded-lg p-3">
                <p className="font-semibold text-blue-700">{WEEKDAYS[s.weekday]}</p>
                <p className="text-sm text-gray-600">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</p>
                {s.break_start && (
                  <p className="text-xs text-gray-400">перерва {s.break_start.slice(0, 5)}–{s.break_end?.slice(0, 5)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Відгуки {reviews.length > 0 && <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">Відгуків ще немає</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={r.rating} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{r.patient_name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{r.service_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
