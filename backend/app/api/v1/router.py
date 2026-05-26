from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    appointments,
    auth,
    before_after,
    contact_messages,
    doctors,
    finance,
    meta,
    notifications,
    positions,
    promo_codes,
    reviews,
    services,
    clinic_settings,
    patients,
)

api_router = APIRouter()
api_router.include_router(meta.router, prefix="/meta", tags=["meta"])
api_router.include_router(clinic_settings.router, prefix="/clinic-settings", tags=["clinic-settings"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(promo_codes.router, prefix="/promo-codes", tags=["promo-codes"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(before_after.router, prefix="/before-after", tags=["before-after"])
api_router.include_router(contact_messages.router, prefix="/contact-messages", tags=["contact-messages"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
