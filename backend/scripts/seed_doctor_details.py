"""Seed education, achievements, experience_years for all doctors."""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.doctor_profile import DoctorProfile
from app.models.user import User

DOCTOR_DETAILS = {
    # doctor_id -> (experience_years, education (newline-separated), achievements (newline-separated))
    2: (
        12,
        "Національний медичний університет ім. О.О. Богомольця, стоматологічний факультет\nСпеціалізація: терапевтична стоматологія",
        "Сертифікат із сучасних технологій відбілювання зубів (Zoom 4)\nЧлен Асоціації стоматологів України",
    ),
    3: (
        18,
        "Львівський національний медичний університет, стоматологічний факультет\nКурс підвищення кваліфікації: хірургічна стоматологія, Варшава",
        "Сертифікат з дентальної імплантації ITI\nБіля 2000 успішно проведених операцій",
    ),
    4: (
        10,
        "Харківський національний медичний університет, стоматологічний факультет\nОртодонтія: постдипломна підготовка, Університет Кракова",
        "Сертифікат Invisalign Provider\nСертифікат із системи Damon Braces",
    ),
    5: (
        15,
        "Одеський національний медичний університет, стоматологічний факультет\nСпеціалізація: терапевтична та естетична стоматологія",
        "Сертифікат із художньої реставрації зубів\nДипломант конкурсу «Кращий терапевт року — 2021»",
    ),
    6: (
        8,
        "Національний медичний університет ім. О.О. Богомольця\nДитяча стоматологія: постдипломна підготовка, Київ",
        "Сертифікат із стоматологічного лікування дітей із підвищеним рівнем тривожності\nСпеціаліст зі скандинавської методики знеболення для дітей",
    ),
    7: (
        20,
        "Київський медичний університет, стоматологічний факультет\nKurs імплантологии та кісткової пластики, Берлін",
        "Сертифікований імплантолог Nobel Biocare\nПонад 3000 встановлених імплантів\nЧлен Міжнародної асоціації імплантологів (IAO)",
    ),
    8: (
        11,
        "Дніпровський державний медичний університет, стоматологічний факультет\nПародонтологія: постдипломна підготовка, Університет Відня",
        "Сертифікат із лазерної пародонтологічної терапії\nДипломант міжнародної конференції з пародонтології, 2022",
    ),
    9: (
        14,
        "Харківський національний медичний університет\nОртопедична стоматологія: курс CAD/CAM протезування",
        "Сертифікований техніст зубних протезів (CEREC)\nСертифікат із естетичних металокерамічних конструкцій",
    ),
    10: (
        9,
        "Національний медичний університет ім. О.О. Богомольця\nKurs косметичної стоматології та відбілювання, Мілан",
        "Сертифікат Opalescence Whitening Provider\nСертифікат із порцелянових вінірів (DaVinci Veneers)\nПереможець конкурсу «Естетика в стоматології — 2023»",
    ),
}


def main() -> None:
    db = SessionLocal()
    try:
        updated = 0
        for doctor_id, (exp_years, education, achievements) in DOCTOR_DETAILS.items():
            doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
            if not doc:
                print(f"Doctor {doctor_id} not found, skipping")
                continue
            doc.experience_years = exp_years
            doc.education = education
            doc.achievements = achievements
            updated += 1
        db.commit()
        print(f"Updated {updated} doctors with education/achievements/experience")
    finally:
        db.close()


if __name__ == "__main__":
    main()
