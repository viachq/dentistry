export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Новий",
    confirmed: "Підтверджено",
    completed: "Завершено",
    cancelled: "Скасовано",
    no_show: "Не з'явився",
    pending: "Очікує",
    paid: "Оплачено",
    failed: "Помилка",
    refunded: "Повернено",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-yellow-100 text-yellow-800",
    pending: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
