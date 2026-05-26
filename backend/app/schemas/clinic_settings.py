from pydantic import BaseModel, ConfigDict, Field


class ClinicSettingsBase(BaseModel):
    brand_name: str = Field(min_length=2, max_length=120)
    tagline: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    instagram_url: str | None = Field(default=None, max_length=255)
    telegram_url: str | None = Field(default=None, max_length=255)
    facebook_url: str | None = Field(default=None, max_length=255)
    youtube_url: str | None = Field(default=None, max_length=255)
    tiktok_url: str | None = Field(default=None, max_length=255)
    twitter_url: str | None = Field(default=None, max_length=255)
    viber_url: str | None = Field(default=None, max_length=255)
    whatsapp_url: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=255)
    working_hours_note: str | None = Field(default=None, max_length=255)
    about_text: str | None = None


class ClinicSettingsUpdate(ClinicSettingsBase):
    pass


class ClinicSettingsRead(ClinicSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
