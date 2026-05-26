import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import type { Doctor, Review, Service, ClinicSettings } from "../shared/types";
import { formatCurrency } from "../shared/format";
import LoadingBlock from "../components/LoadingBlock";
import StarRating from "../components/StarRating";
import SocialLinks from "../components/SocialLinks";

const FAQ_ITEMS = [
  {
    q: "Як часто потрібно відвідувати стоматолога?",
    a: "Рекомендуємо проходити профілактичний огляд кожні 6 місяців — навіть якщо нічого не турбує. Раннє виявлення проблеми коштує значно дешевше та вимагає менше часу, ніж запущене лікування. При наявності брекетів або імплантів — частіше, за графіком лікаря.",
  },
  {
    q: "Чи боляче лікувати зуби у вашій клініці?",
    a: "Ні. Всі процедури виконуються під якісною місцевою анестезією. Ви можете підняти руку в будь-який момент — лікар зупиниться. При підвищеній тривожності пропонуємо седацію: ви залишаєтесь у свідомості, але розслаблені та без відчуття дискомфорту.",
  },
  {
    q: "Що входить у консультацію?",
    a: "Огляд ротової порожнини, визначення проблеми, рекомендації щодо лікування та орієнтовна вартість. За потреби — прицільний рентгенівський знімок. Консультація безкоштовна, без прихованих платежів і тиску.",
  },
  {
    q: "Чи можна лікувати зуби під час вагітності?",
    a: "Так, і навіть потрібно — не варто терпіти біль чи запалення. Оптимальний період — другий триместр. Ми використовуємо анестетики, безпечні для вагітних, і за можливості уникаємо рентгенографії. Повідомте лікаря про вагітність до початку прийому.",
  },
  {
    q: "Скільки часу займає встановлення імпланта?",
    a: "Сама операція — 30–60 хвилин. Повний цикл від установки до фінальної коронки — 3–6 місяців: стільки кістці потрібно, щоб зрости з імплантом. У деяких випадках тимчасову коронку ставлять того ж дня.",
  },
  {
    q: "Як довго служить пломба та кераміка?",
    a: "Якісна композитна пломба — 5–8 років, кераміка та циркон — 15–20 років і більше. Термін залежить від матеріалу, навантаження та гігієни. Ми документуємо всі роботи та надаємо гарантію на кожну процедуру.",
  },
  {
    q: "Як підготуватися до першого прийому?",
    a: "Почистіть зуби перед візитом. Якщо є попередні рентгенівські знімки або виписки від інших лікарів — візьміть їх. Поїжте, якщо прийом не натщесерце. Запізнення до 10 хвилин — прийнятне, але попередьте адміністратора.",
  },
  {
    q: "Як записатися на прийом?",
    a: "Онлайн через форму на сайті — обирайте лікаря та зручний час самостійно. Або зателефонуйте нам у робочі години. Адміністратор підбере оптимальний варіант і нагадає про візит за день до прийому.",
  },
];

const PRINCIPLES = [
  {
    num: "01",
    title: "Вузька спеціалізація",
    desc: "Кожен лікар — спеціаліст у своїй галузі. Терапевт, хірург, ортодонт і педіатричний стоматолог — окремі фахівці, а не один «всезнайка».",
  },
  {
    num: "02",
    title: "Прозора ціна",
    desc: "Кошторис лікування ви отримуєте до початку процедури. Жодних доплат у процесі — ціна фіксується і не змінюється.",
  },
  {
    num: "03",
    title: "Фотодокументація",
    desc: "Ми фотографуємо кожен клінічний випадок до та після. Це ваша гарантія якості і можливість бачити результат.",
  },
  {
    num: "04",
    title: "Тільки сертифіковані матеріали",
    desc: "Використовуємо матеріали провідних виробників — Straumann, 3M, Ivoclar. Жодних дешевих замінників заради маржі.",
  },
  {
    num: "05",
    title: "Гарантія на роботи",
    desc: "Надаємо письмову гарантію на всі процедури. Якщо щось пішло не так з нашої вини — усуваємо безкоштовно.",
  },
  {
    num: "06",
    title: "Комфорт і безболісність",
    desc: "Сучасна анестезія, тиха атмосфера, без черг. При тривожності — седація. Ваш психологічний комфорт так само важливий, як фізичний.",
  },
];

export default function HomePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Doctor[]>("/doctors"),
      api.get<Service[]>("/services"),
      api.get<ClinicSettings>("/clinic-settings"),
      api.get<Review[]>("/reviews?moderation_status=approved"),
    ])
      .then(([d, s, c, r]) => {
        setDoctors(d.data);
        setServices(s.data);
        setSettings(c.data);
        setReviews(r.data.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;

  return (
    <div className="font-sans">
      {/* Hero — video background */}
      <section className="relative h-[90vh] min-h-[560px] flex items-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/60 to-blue-800/30" />

        <div className="relative w-full max-w-6xl mx-auto px-6 py-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.08] mb-4 max-w-2xl">
            {settings?.brand_name ?? "DentaCare"}
          </h1>
          <p className="text-base text-white/60 mb-10 max-w-lg">
            {settings?.tagline ?? "Ваша посмішка — наша турбота"}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/login?tab=register"
              className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              Записатися на прийом
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm"
            >
              Наші послуги
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Гортайте</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "12+", label: "років досвіду" },
            { value: "8 000+", label: "задоволених пацієнтів" },
            { value: "15", label: "спеціалістів" },
            { value: "98%", label: "позитивних відгуків" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-300 mb-1">{s.value}</div>
              <div className="text-sm text-blue-200/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Чому обирають нас</h2>
            <p className="text-gray-500">Ми поєднуємо сучасні технології з індивідуальним підходом до кожного пацієнта.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Сучасне обладнання",
                desc: "Цифровий рентген, 3D-томографія та лазерне лікування для максимальної точності діагностики.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />,
              },
              {
                title: "Досвідчені лікарі",
                desc: "Команда сертифікованих стоматологів з міжнародними дипломами та багаторічним клінічним досвідом.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
              },
              {
                title: "Онлайн-запис 24/7",
                desc: "Записуйтесь у будь-який час без дзвінків. Нагадування про візит надійде автоматично.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Послуги</h2>
              <p className="text-gray-500">Повний спектр стоматологічної допомоги в одному місці</p>
            </div>
            <Link to="/login?tab=register" className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium">
              Записатися на прийом →
            </Link>
          </div>
          {services.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Послуги ще не додані</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <div key={svc.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-2">{svc.name}</h3>
                  {svc.description && (
                    <p className="text-sm text-gray-500 mb-4 flex-1 leading-relaxed">{svc.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <span className="text-blue-600 font-bold text-lg">{formatCurrency(svc.price)}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{svc.duration_minutes} хв</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Наші лікарі</h2>
            <p className="text-gray-500">Познайомтесь з командою спеціалістів</p>
          </div>
          {doctors.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Лікарі ще не додані</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/doctors/${doc.id}`}
                  className="group block rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="h-64 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {doc.photo_url ? (
                      <img src={doc.photo_url} alt={doc.full_name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-5xl font-bold text-blue-200">{doc.full_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.full_name}</h3>
                    <p className="text-sm text-blue-600 mt-0.5 mb-2">{doc.title}</p>
                    {doc.rating > 0 && (
                      <StarRating rating={doc.rating} size="sm" showValue />
                    )}
                    {doc.bio && <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">{doc.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {doctors.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/team" className="btn-secondary inline-block">
                Переглянути всю команду
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Our Principles */}
      <section className="py-20 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-14">
            <h2 className="text-3xl font-bold mb-3">Наш підхід</h2>
            <p className="text-gray-400">Шість принципів, якими ми керуємося в роботі з кожним пацієнтом.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-800">
            {PRINCIPLES.map((p) => (
              <div key={p.num} className="bg-gray-950 p-8 hover:bg-gray-900 transition-colors">
                <div className="text-4xl font-bold text-gray-800 mb-4 font-mono">{p.num}</div>
                <h3 className="font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Відгуки пацієнтів</h2>
                <p className="text-gray-500">Що кажуть ті, хто вже відвідав нашу клініку</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <StarRating rating={r.rating} size="md" />
                  </div>
                  {r.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.comment}"</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.patient_name}</p>
                      <p className="text-xs text-gray-400">{r.service_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{r.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-1">Готові записатися?</h2>
            <p className="text-blue-100 text-sm">Онлайн-запис займає менше хвилини. Вибір лікаря та зручного часу.</p>
          </div>
          <Link
            to="/login?tab=register"
            className="shrink-0 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            Записатися зараз
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Часті запитання</h2>
            <p className="text-gray-500">Відповіді на найпопулярніші питання наших пацієнтів.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx}>
                <button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className={`font-medium text-gray-900 group-hover:text-blue-600 transition-colors ${openFaq === idx ? "text-blue-600" : ""}`}>
                    {item.q}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === idx ? "rotate-45 text-blue-600" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="pb-5 pr-10">
                    <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-12 text-gray-100">Контакти</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: info */}
            <div className="space-y-6">
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Адреса</p>
                  <p className="text-gray-200 font-medium">{settings?.address ?? "вул. Хрещатик, 22, Київ"}</p>
                </div>
              </div>

              {/* Phone */}
              {settings?.phone && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Телефон</p>
                    <a href={`tel:${settings.phone}`} className="text-gray-200 font-medium hover:text-white transition-colors text-lg">{settings.phone}</a>
                  </div>
                </div>
              )}

              {/* Email */}
              {settings?.email && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${settings.email}`} className="text-gray-200 font-medium hover:text-white transition-colors">{settings.email}</a>
                  </div>
                </div>
              )}

              {/* Hours */}
              {settings?.working_hours_note && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Графік роботи</p>
                    <p className="text-gray-200 font-medium">{settings.working_hours_note}</p>
                  </div>
                </div>
              )}

              {/* Social */}
              {settings && (
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Ми в соцмережах</p>
                  <SocialLinks settings={settings} iconClassName="w-6 h-6" />
                </div>
              )}

              <div className="pt-2">
                <Link to="/login?tab=register" className="btn-primary inline-block">
                  Записатися на прийом
                </Link>
              </div>
            </div>

            {/* Right: map */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ height: "420px" }}>
              <iframe
                title="Розташування клініки"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=30.510%2C50.443%2C30.530%2C50.453&layer=mapnik&marker=50.4482%2C30.5234"
              />
              {/* Expand overlay button */}
              <a
                href="https://www.openstreetmap.org/?mlat=50.4482&mlon=30.5234#map=16/50.4482/30.5234"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-white text-gray-800 text-xs font-medium px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Відкрити карту
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
