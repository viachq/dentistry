import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[10rem] font-bold leading-none text-gray-100 select-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-blue-600/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5c-1 .02-4-1.34-6.36.71C4.03 7.1 3.37 9.4 4.16 12.43c.54 2.1 1.36 3.75 2.64 4.68.7.67.55 2.6 1.2 3.39C9 22 11 20.5 12 19.5c1 1 3 2.5 4 1 .65-.8.5-2.72 1.2-3.39 1.28-.93 2.1-2.58 2.64-4.68.78-3.03.12-5.33-1.48-6.72C16.98 3.66 13 5.02 12 5z"/>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Сторінку не знайдено</h1>
        <p className="text-gray-500 mb-8">
          Сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-primary px-6">
            На головну
          </Link>
          <Link to="/team" className="btn-secondary px-6">
            Наші лікарі
          </Link>
        </div>
      </div>
    </div>
  );
}
