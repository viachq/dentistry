"""Seed before/after demo cases."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.before_after import BeforeAfterCase
from app.models.doctor_profile import DoctorProfile

CASES = [
    {
        "title": "Первинне лікування каналів зуба",
        "description": "Ендодонтичне лікування з використанням мікроскопа",
        "before_image_url": "/uploads/before-after/case1_before.png",
        "after_image_url": "/uploads/before-after/case1_after.png",
    },
    {
        "title": "Відбілювання зубів",
        "description": "Професійне відбілювання на 6 тонів за один сеанс",
        "before_image_url": "/uploads/before-after/case2_before.jpg",
        "after_image_url": "/uploads/before-after/case2_after.jpg",
    },
    {
        "title": "Відновлення зуба після травми",
        "description": "Реставрація постійного зуба після механічного пошкодження",
        "before_image_url": "/uploads/before-after/case3_before.png",
        "after_image_url": "/uploads/before-after/case3_after.png",
    },
    {
        "title": "Лікування карієсу жувальних зубів",
        "description": "Реставрація композитними матеріалами 3M",
        "before_image_url": "/uploads/before-after/case4_before.jpg",
        "after_image_url": "/uploads/before-after/case4_after.jpg",
    },
    {
        "title": "Резекція верхівки кореня",
        "description": "Хірургічне лікування 4-х передніх зубів",
        "before_image_url": "/uploads/before-after/case5_before.png",
        "after_image_url": "/uploads/before-after/case5_after.png",
    },
    {
        "title": "Видалення уламка інструмента",
        "description": "Видалення зламаного інструмента із кореневого каналу",
        "before_image_url": "/uploads/before-after/case6_before.png",
        "after_image_url": "/uploads/before-after/case6_after.png",
    },
    {
        "title": "Повторне ендодонтичне лікування",
        "description": "Перелікування каналів із сучасною обтурацією",
        "before_image_url": "/uploads/before-after/case7_before.png",
        "after_image_url": "/uploads/before-after/case7_after.png",
    },
    {
        "title": "Облітерація каналу",
        "description": "Лікування облітерованого кореневого каналу під мікроскопом",
        "before_image_url": "/uploads/before-after/case8_before.png",
        "after_image_url": "/uploads/before-after/case8_after.png",
    },
    {
        "title": "Внутрішня резорбція кореня",
        "description": "Діагностика та лікування внутрішньої резорбції",
        "before_image_url": "/uploads/before-after/case9_before.png",
        "after_image_url": "/uploads/before-after/case9_after.png",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(BeforeAfterCase).count()
        if existing:
            print(f"Already have {existing} cases, skipping seed.")
            return

        doctor = db.query(DoctorProfile).first()
        if not doctor:
            print("No doctor found. Seed a doctor first.")
            return

        for data in CASES:
            case = BeforeAfterCase(doctor_id=doctor.id, **data)
            db.add(case)

        db.commit()
        print(f"Seeded {len(CASES)} before/after cases (doctor_id={doctor.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
