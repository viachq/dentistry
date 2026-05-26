"""Add twitter, viber, whatsapp, linkedin URLs to clinic settings."""
from alembic import op

revision = "20260526_0005"
down_revision = "20260515_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE clinicsettings
        ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
        ADD COLUMN IF NOT EXISTS viber_url VARCHAR(255),
        ADD COLUMN IF NOT EXISTS whatsapp_url VARCHAR(255),
        ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE clinicsettings
        DROP COLUMN IF EXISTS twitter_url,
        DROP COLUMN IF EXISTS viber_url,
        DROP COLUMN IF EXISTS whatsapp_url,
        DROP COLUMN IF EXISTS linkedin_url;
    """)
