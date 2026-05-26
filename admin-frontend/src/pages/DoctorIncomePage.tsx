import { useEffect, useState } from "react";
import { api } from "../shared/api";
import type { DoctorFinanceSummary } from "../shared/types";
import { formatCurrency } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";

export default function DoctorIncomePage() {
  const [summary, setSummary] = useState<DoctorFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DoctorFinanceSummary>("/finance/doctors/me")
      .then((r) => setSummary(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (!summary) return <div className="text-gray-400 text-center py-20">Дані недоступні</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Мій дохід</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{summary.completed_appointments}</p>
          <p className="text-sm text-gray-500">Завершено</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{summary.paid_appointments}</p>
          <p className="text-sm text-gray-500">Оплачено</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-700">{formatCurrency(summary.gross_revenue)}</p>
          <p className="text-sm text-gray-500">Загальна виручка</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.payout_amount)}</p>
          <p className="text-sm text-gray-500">Ваша виплата</p>
        </div>
      </div>

      <div className="card max-w-lg">
        <h2 className="font-semibold text-gray-900 mb-4">Деталі розрахунку</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Завершених візитів</span>
            <span className="font-medium">{summary.completed_appointments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Оплачених візитів</span>
            <span className="font-medium">{summary.paid_appointments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Загальна виручка</span>
            <span className="font-medium">{formatCurrency(summary.gross_revenue)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Ваша виплата</span>
            <span className="font-bold text-purple-600 text-lg">{formatCurrency(summary.payout_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
