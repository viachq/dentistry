from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationRead, NotificationUnreadCount


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    link: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_new_appointment(db: Session, appointment: Appointment) -> None:
    doctor_user = appointment.doctor.user
    patient = appointment.patient
    service = appointment.service

    # Notify doctor
    create_notification(
        db,
        user_id=doctor_user.id,
        notification_type=NotificationType.NEW_APPOINTMENT,
        title="Новий запис",
        message=f"Пацієнт {patient.full_name} записався на {service.name} "
                f"{appointment.starts_at.strftime('%d.%m.%Y %H:%M')}",
        link=f"/appointments/{appointment.id}",
    )


def notify_status_change(db: Session, appointment: Appointment, old_status: str) -> None:
    new_status = appointment.status
    patient = appointment.patient
    doctor_user = appointment.doctor.user
    service = appointment.service

    type_map = {
        "confirmed": NotificationType.APPOINTMENT_CONFIRMED,
        "completed": NotificationType.APPOINTMENT_COMPLETED,
        "cancelled": NotificationType.APPOINTMENT_CANCELLED,
        "no_show": NotificationType.APPOINTMENT_NO_SHOW,
    }
    title_map = {
        "confirmed": "Запис підтверджено",
        "completed": "Візит завершено",
        "cancelled": "Запис скасовано",
        "no_show": "Пацієнт не з'явився",
    }

    notif_type = type_map.get(new_status)
    title = title_map.get(new_status, "Статус запису змінено")
    if not notif_type:
        return

    # Notify patient
    create_notification(
        db,
        user_id=patient.id,
        notification_type=notif_type,
        title=title,
        message=f"Ваш запис до лікаря {doctor_user.full_name} на {service.name} "
                f"{appointment.starts_at.strftime('%d.%m.%Y %H:%M')} — {title.lower()}",
        link=f"/appointments/{appointment.id}",
    )


def get_my_notifications(db: Session, current_user: User) -> list[NotificationRead]:
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [NotificationRead.model_validate(n) for n in notifs]


def get_unread_count(db: Session, current_user: User) -> NotificationUnreadCount:
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return NotificationUnreadCount(count=count)


def mark_all_read(db: Session, current_user: User) -> None:
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()


def mark_notification_read(db: Session, notification_id: int, current_user: User) -> NotificationRead:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Сповіщення не знайдено")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationRead.model_validate(notif)
