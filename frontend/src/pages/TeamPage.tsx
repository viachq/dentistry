import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import type { Doctor } from "../shared/types";
import StarRating from "../components/StarRating";
import { DoctorCardSkeleton } from "../components/Skeleton";

export default function TeamPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Doctor[]>("/doctors?is_active=true")
      .then((r) => setDoctors(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded mb-2" />
          <div className="animate-pulse bg-gray-200 h-5 w-72 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <DoctorCardSkeleton key={i} />)}
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Наша команда</h1>
        <p className="text-gray-500 text-lg">Досвідчені спеціалісти, яким можна довіряти</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <Link
            key={doc.id}
            to={`/doctors/${doc.id}`}
            className="group block rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Photo */}
            <div className="h-72 bg-gray-50 flex items-center justify-center overflow-hidden">
              {doc.photo_url ? (
                <img
                  src={doc.photo_url}
                  alt={doc.full_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-6xl font-bold text-blue-200">
                  {doc.full_name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {doc.full_name}
              </h2>
              <p className="text-sm text-blue-600 font-medium mt-0.5 mb-2">{doc.title}</p>

              {doc.rating > 0 && (
                <div className="mb-3">
                  <StarRating rating={doc.rating} size="sm" showValue />
                </div>
              )}

              {doc.experience_years != null && (
                <p className="text-sm text-gray-500 mb-1">
                  Досвід: <span className="font-medium text-gray-700">{doc.experience_years} р.</span>
                </p>
              )}

              {doc.education && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {doc.education.split("\n")[0]}
                </p>
              )}

              {doc.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {doc.services.slice(0, 3).map(({ service }) => (
                    <span
                      key={service.id}
                      className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5"
                    >
                      {service.name}
                    </span>
                  ))}
                  {doc.services.length > 3 && (
                    <span className="text-xs text-gray-400 px-1 py-0.5">
                      +{doc.services.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
