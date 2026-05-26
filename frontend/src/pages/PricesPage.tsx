import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import type { Service } from "../shared/types";
import { formatCurrency } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

const CATEGORY_ORDER = [
  "Консультація",
  "Діагностика",
  "Гігієна",
  "Терапія",
  "Хірургія",
  "Імплантація",
  "Ортопедія",
  "Естетика",
  "Ортодонтія",
  "Пародонтологія",
  "Дитяча стоматологія",
];

export default function PricesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Service[]>("/services")
      .then((r) => setServices(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;

  const grouped: Record<string, Service[]> = {};
  for (const svc of services) {
    const cat = svc.category ?? "Інше";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(svc);
  }

  const categories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-14">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide mb-2">
          Ціни — Стоматологія DentaCare
        </h1>
        <p className="text-gray-400 text-sm italic mb-10">
          * Кінцева вартість лікування буде узгоджена після консультації лікаря
        </p>

        {/* Accordion */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {categories.map((cat, idx) => {
            const items = grouped[cat];
            const isOpen = open === cat;

            return (
              <div key={cat} className={idx > 0 ? "border-t border-gray-200" : ""}>
                {/* Header */}
                <button
                  onClick={() => setOpen(isOpen ? null : cat)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    {/* +/- icon in terracotta */}
                    <span
                      className="text-xl font-light transition-transform select-none"
                      style={{ color: "#cea28b" }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                    <span className="font-medium text-gray-800 text-base group-hover:text-gray-900">
                      {cat}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {items.length} {items.length === 1 ? "послуга" : items.length < 5 ? "послуги" : "послуг"}
                  </span>
                </button>

                {/* Expanded table */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Послуга
                          </th>
                          <th className="px-6 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Ціна, грн
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((svc, i) => (
                          <tr
                            key={svc.id}
                            style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" }}
                          >
                            <td className="px-6 py-3.5 border-t border-gray-100">
                              <p className="text-sm text-gray-800">{svc.name}</p>
                              {svc.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                              )}
                            </td>
                            <td className="px-6 py-3.5 border-t border-gray-100 text-right whitespace-nowrap">
                              {svc.duration_minutes > 0 && (
                                <span className="text-xs text-gray-400 mr-3">{svc.duration_minutes} хв</span>
                              )}
                              <span
                                className="font-semibold text-sm"
                                style={{ color: "#cea28b" }}
                              >
                                {svc.price.toLocaleString("uk-UA")} ₴
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4 text-sm">
            Маєте питання щодо вартості? Запишіться на безкоштовну консультацію
          </p>
          <Link
            to="/login?tab=register"
            className="inline-block bg-gray-900 hover:bg-gray-700 text-white font-medium px-8 py-3.5 rounded-xl transition-colors uppercase tracking-wide text-sm"
          >
            Записатися зараз
          </Link>
        </div>
      </div>
    </div>
  );
}
