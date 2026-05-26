import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import type { ClinicSettings } from "../shared/types";

const VALUES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Безпека та стерильність",
    desc: "Повна стерилізація інструментів після кожного пацієнта. Одноразові матеріали та суворий контроль інфекцій відповідно до європейських протоколів.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    title: "Постійне навчання",
    desc: "Наші лікарі регулярно проходять курси підвищення кваліфікації в Україні та за кордоном, впроваджуючи найновіші методики лікування.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Індивідуальний підхід",
    desc: "Кожен план лікування розробляється індивідуально з урахуванням потреб, побажань та фінансових можливостей пацієнта.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Сучасні технології",
    desc: "3D-томографія, цифрове сканування, лазерне лікування та CAD/CAM-технології для виготовлення коронок за один візит.",
  },
];

const MILESTONES = [
  { year: "2014", event: "Відкриття клініки DentaCare з двома кабінетами" },
  { year: "2016", event: "Запуск відділення імплантації та протезування" },
  { year: "2018", event: "Розширення до 5 кабінетів, впровадження 3D-діагностики" },
  { year: "2020", event: "Відкриття дитячого відділення, онлайн-запис" },
  { year: "2023", event: "Більше 8 000 пацієнтів, команда з 15 спеціалістів" },
  { year: "2026", event: "Запуск цифрової платформи для пацієнтів" },
];

export default function AboutPage() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);

  useEffect(() => {
    api.get<ClinicSettings>("/clinic-settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="bg-gray-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Про клініку</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {settings?.about_text ??
              "DentaCare — сучасна стоматологічна клініка в Києві, яка поєднує передові технології, досвідчених спеціалістів та індивідуальний підхід до кожного пацієнта."}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "12+", label: "років досвіду" },
            { value: "8 000+", label: "задоволених пацієнтів" },
            { value: "15", label: "спеціалістів" },
            { value: "5", label: "обладнаних кабінетів" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold mb-1">{s.value}</div>
              <div className="text-sm text-blue-100">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Наша місія</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Зробити якісну стоматологію доступною та комфортною
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ми віримо, що кожна людина заслуговує на здорову та красиву посмішку. Наша команда працює,
                щоб зробити відвідування стоматолога позитивним досвідом — без страху, болю та прихованих платежів.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                З 2014 року ми допомогли більш ніж 8 000 пацієнтів. Кожен випадок — це індивідуальний план
                лікування, чесна ціна та гарантія якості. Ми не економимо на матеріалах і не поспішаємо —
                ваше здоров'я для нас на першому місці.
              </p>
              <Link to="/team" className="btn-primary inline-block">
                Познайомитись з командою
              </Link>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-6">Наша історія</p>
              <div className="space-y-6">
                {MILESTONES.map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
                      {i < MILESTONES.length - 1 && <div className="w-px flex-1 bg-blue-200 mt-1" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-bold text-blue-600">{m.year}</p>
                      <p className="text-sm text-gray-600">{m.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Наші цінності</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Принципи, яких ми дотримуємося кожного дня</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-5">
                  {v.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-1">Маєте запитання?</h2>
            <p className="text-blue-100 text-sm">Зв'яжіться з нами або запишіться на безкоштовну консультацію.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login?tab=register" className="shrink-0 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
              Записатися
            </Link>
            <Link to="/#contacts" className="shrink-0 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Контакти
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
