"""Seed demo data: doctor, patient, services, appointments."""
import sys
from datetime import date, datetime, time, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.doctor_profile import DoctorProfile
from app.models.service import Service, DoctorService
from app.models.schedule import WorkSchedule
from app.models.clinic_settings import ClinicSettings


def main() -> None:
    db = SessionLocal()
    try:
        # Demo doctor
        doc_user = db.query(User).filter(User.username == "doctor_demo").first()
        if not doc_user:
            doc_user = User(
                username="doctor_demo",
                hashed_password=get_password_hash("doctor12345"),
                full_name="Олена Коваль",
                phone="+380501234567",
                email="dr.koval@dentacare.ua",
                role=UserRole.DOCTOR,
                is_active=True,
            )
            db.add(doc_user)
            db.flush()

            doc_profile = DoctorProfile(
                user_id=doc_user.id,
                title="Стоматолог-терапевт",
                bio="Досвідчений стоматолог з 10 роками практики. Спеціалізується на лікуванні карієсу та ендодонтії.",
                commission_percent=40.0,
            )
            db.add(doc_profile)
            db.flush()

            # Work schedule Mon-Fri
            for weekday in range(5):
                db.add(WorkSchedule(
                    doctor_id=doc_profile.id,
                    weekday=weekday,
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                    break_start=time(13, 0),
                    break_end=time(14, 0),
                ))
            print(f"Created doctor: {doc_user.username}")

        # Demo patient
        pat_user = db.query(User).filter(User.username == "patient_demo").first()
        if not pat_user:
            pat_user = User(
                username="patient_demo",
                hashed_password=get_password_hash("patient12345"),
                full_name="Іван Петренко",
                phone="+380671234567",
                role=UserRole.PATIENT,
                is_active=True,
            )
            db.add(pat_user)
            print(f"Created patient: {pat_user.username}")

        # Services
        services_data = [
            ("Консультація", "Первинний огляд та консультація лікаря", 30, 500.0),
            ("Лікування карієсу", "Лікування карієсу з пломбуванням", 60, 1200.0),
            ("Видалення зуба", "Проста екстракція зуба", 45, 800.0),
            ("Чищення зубів", "Професійне ультразвукове чищення", 60, 1000.0),
            ("Відбілювання", "Фотовідбілювання зубів", 90, 3500.0),
            ("Рентген", "Цифровий рентген одного зуба", 15, 200.0),
        ]
        for name, desc, duration, price in services_data:
            existing = db.query(Service).filter(Service.name == name).first()
            if not existing:
                svc = Service(name=name, description=desc, duration_minutes=duration, price=price)
                db.add(svc)
                db.flush()

                # Get doc_profile if created above
                dp = db.query(DoctorProfile).filter(DoctorProfile.user_id == doc_user.id).first()
                if dp:
                    db.add(DoctorService(doctor_id=dp.id, service_id=svc.id))
                print(f"Created service: {name}")

        # Update clinic settings
        settings = db.query(ClinicSettings).first()
        if settings:
            settings.address = "вул. Хрещатик, 1, Київ, 01001"
            settings.phone = "+380 44 123 45 67"
            settings.email = "info@dentacare.ua"
            settings.instagram_url = "https://instagram.com/dentacare"
            settings.about_text = (
                "DentaCare — сучасна стоматологічна клініка у центрі Києва. "
                "Ми пропонуємо повний спектр стоматологічних послуг з використанням "
                "новітніх технологій та матеріалів."
            )

        db.commit()
        print("Demo data seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
