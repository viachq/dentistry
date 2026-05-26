import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body_html: str) -> None:
    """Send an HTML email. Silently skips if smtp_host is not configured."""
    if not settings.smtp_host:
        logger.debug("SMTP not configured — skipping email to %s", to)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    try:
        if settings.smtp_tls:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
            server.ehlo()
            server.starttls()
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
            server.ehlo()

        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)

        server.sendmail(settings.smtp_from, [to], msg.as_string())
        server.quit()
        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to send email to %s: %s", to, exc)


def send_registration_email(to: str, full_name: str) -> None:
    """Send a welcome email to a newly registered patient."""
    subject = "Ласкаво просимо до DentaCare!"
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb;">Ласкаво просимо, {full_name}!</h2>
        <p>Дякуємо, що зареєструвалися в <strong>DentaCare</strong>.</p>
        <p>Тепер ви можете:</p>
        <ul>
          <li>Записатися на прийом до наших лікарів</li>
          <li>Переглянути свою медичну картку</li>
          <li>Отримувати нагадування про заплановані візити</li>
        </ul>
        <p>З повагою,<br>Команда <strong>DentaCare</strong></p>
      </body>
    </html>
    """
    send_email(to, subject, body_html)


def send_appointment_confirmation(
    to: str,
    full_name: str,
    doctor_name: str,
    service_name: str,
    starts_at: str,
) -> None:
    """Send an appointment confirmation email to the patient."""
    subject = "Запис підтверджено — DentaCare"
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb;">Ваш запис підтверджено, {full_name}!</h2>
        <p>Деталі вашого візиту:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 480px;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Послуга:</td>
            <td style="padding: 8px;">{service_name}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 8px; font-weight: bold;">Лікар:</td>
            <td style="padding: 8px;">{doctor_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Дата та час:</td>
            <td style="padding: 8px;">{starts_at}</td>
          </tr>
        </table>
        <p style="margin-top: 16px;">
          Будь ласка, приходьте за 5–10 хвилин до початку прийому.<br>
          Якщо вам потрібно перенести або скасувати запис — зробіть це в особистому кабінеті.
        </p>
        <p>З повагою,<br>Команда <strong>DentaCare</strong></p>
      </body>
    </html>
    """
    send_email(to, subject, body_html)
