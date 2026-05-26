import { useEffect, useState } from "react";
import { api } from "../shared/api";
import { useAuth } from "../features/auth/AuthProvider";
import type { Review, Doctor } from "../shared/types";
import { formatDateTime } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

export default function DoctorReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    api.get<Doctor[]>("/doctors").then((r) => {
      const myDoc = r.data.find((d) => d.user_id === user?.id);
      if (myDoc) {
        setDoctor(myDoc);
        return api.get<Review[]>(`/reviews?doctor_id=${myDoc.id}&moderation_status=approved`);
      }
      return null;
    }).then((r) => {
      if (r) setReviews(r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Мої відгуки</h1>
        {reviews.length > 0 && (
          <p className="text-gray-500 text-sm">Середня оцінка: ⭐ {avgRating} ({reviews.length} відгуків)</p>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⭐</div>
          <p>Відгуків ще немає</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{r.patient_name}</p>
                  <p className="text-xs text-gray-400">{r.service_name} • {formatDateTime(r.appointment_starts_at)}</p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-5 h-5 ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{r.comment}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{formatDateTime(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
