"""Seed demo reviews directly into DB, bypassing appointment requirement."""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.review import Review
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, UserRole
from app.models.service import Service
from app.core.security import get_password_hash
from sqlalchemy import func

REVIEWS = [
    # (doctor_id, rating, comment, patient_name_suffix)
    (3, 5, "Андрій Миколайович — просто майстер своєї справи. Видалив зуб мудрості швидко і без болю. Рекомендую всім, хто боїться стоматологів!", "Оксана К."),
    (3, 5, "Звертався з болем, вийшов з посмішкою. Пояснив все доступно, жодного дискомфорту під час процедури.", "Максим Р."),
    (4, 5, "Ігор Сергійович поставив брекети — вже через 8 місяців результат просто вражаючий. Дуже уважний до деталей.", "Анна Л."),
    (4, 4, "Хороший ортодонт, чітко пояснює кожен крок лікування. Єдине — іноді доводиться чекати на прийом.", "Тарас В."),
    (5, 5, "Марія Василівна — неймовірно делікатний лікар. Вперше за 10 років пішла до стоматолога без страху і без болю.", "Людмила Г."),
    (5, 5, "Терапевт від Бога. Вилікувала три зуби за один візит, жодних неприємних відчуттів. Тепер ходжу тільки до неї.", "Іванна П."),
    (6, 5, "Привела 5-річну доньку — Олена Василівна знайшла підхід за 5 хвилин. Дитина більше не боїться стоматолога!", "Мама Аліни С."),
    (6, 4, "Дитячий стоматолог з великою літери. Гульня, відволікання — дитина навіть не зрозуміла, що їй лікують зуб.", "Тетяна М."),
    (7, 5, "Василь Іванович встановив два імпланти — через 4 місяці стоять як рідні зуби. Безболісно, без набряків.", "Олег Д."),
    (7, 5, "Найкращий імплантолог якого знаю. Точна, акуратна робота. Результатом повністю задоволений.", "Степан Ф."),
    (8, 5, "Наталія Миколаївна вирятувала мої ясна — хронічний пародонтит лікувала методично і результативно.", "Галина К."),
    (9, 5, "Дмитро Олексійович зробив коронку — ніхто навіть не здогадується, що вона штучна. Ідеальне попадання в колір.", "Вікторія Н."),
    (10, 5, "Юлія поставила вінірні накладки — тепер соромно не посміхатися! Результат перевершив очікування.", "Катерина О."),
    (10, 5, "Відбілювання у Юлії — зуби стали на 6 тонів світліші. Процедура комфортна, результат тривалий.", "Наді Ш."),
    (2, 4, "Олена Коваль вилікувала запущений карієс. Весь час пояснювала що робить. Відчуття довіри — 100%.", "Богдан С."),
]

def main() -> None:
    db = SessionLocal()
    try:
        # Get or create a demo patient user for reviews
        pat = db.query(User).filter(User.username == "patient_demo").first()
        if not pat:
            print("patient_demo not found, cannot seed reviews")
            return

        # Get first service
        service = db.query(Service).filter(Service.is_active == True).first()
        if not service:
            print("No services found")
            return

        existing_count = db.query(Review).count()
        if existing_count > 0:
            print(f"Reviews already seeded ({existing_count} exist), skipping")
            return

        # Create fake completed appointments and reviews
        base_date = datetime.now(timezone.utc) - timedelta(days=30)
        created = 0

        for idx, (doctor_id, rating, comment, patient_display) in enumerate(REVIEWS):
            doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
            if not doctor:
                print(f"Doctor {doctor_id} not found, skipping")
                continue

            appt_date = base_date - timedelta(days=idx * 2)

            # Create a completed appointment
            appt = Appointment(
                patient_id=pat.id,
                doctor_id=doctor_id,
                service_id=service.id,
                starts_at=appt_date,
                ends_at=appt_date + timedelta(hours=1),
                status=AppointmentStatus.COMPLETED,
                discount_amount=0,
            )
            db.add(appt)
            db.flush()

            review = Review(
                appointment_id=appt.id,
                doctor_id=doctor_id,
                patient_id=pat.id,
                rating=rating,
                comment=comment,
                moderation_status="approved",
            )
            db.add(review)
            db.flush()
            created += 1

        # Recalculate all doctor ratings
        for doc in db.query(DoctorProfile).all():
            reviews = db.query(Review).filter(
                Review.doctor_id == doc.id,
                Review.moderation_status == "approved",
            ).all()
            if reviews:
                doc.rating = round(sum(r.rating for r in reviews) / len(reviews), 2)

        db.commit()
        print(f"Seeded {created} reviews with approved status")

    finally:
        db.close()


if __name__ == "__main__":
    main()
