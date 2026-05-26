"""Add education, achievements, experience_years to doctorprofile."""
from alembic import op

revision = "20260515_0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE doctorprofile
        ADD COLUMN IF NOT EXISTS education TEXT,
        ADD COLUMN IF NOT EXISTS achievements TEXT,
        ADD COLUMN IF NOT EXISTS experience_years INTEGER;
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE doctorprofile
        DROP COLUMN IF EXISTS education,
        DROP COLUMN IF EXISTS achievements,
        DROP COLUMN IF EXISTS experience_years;
    """)
