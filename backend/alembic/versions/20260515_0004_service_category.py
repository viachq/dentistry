"""Add category to service."""
from alembic import op

revision = "20260515_0004"
down_revision = "20260515_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE service
        ADD COLUMN IF NOT EXISTS category VARCHAR(80);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE service
        DROP COLUMN IF EXISTS category;
    """)
