"""Add youtube_url and tiktok_url to clinicsettings."""
from alembic import op

revision = "20260515_0003"
down_revision = "20260515_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE clinicsettings
        ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255),
        ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE clinicsettings
        DROP COLUMN IF EXISTS youtube_url,
        DROP COLUMN IF EXISTS tiktok_url;
    """)
