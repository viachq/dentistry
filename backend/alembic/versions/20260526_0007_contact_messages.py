"""Create contact_message table."""
from alembic import op
import sqlalchemy as sa

revision = "20260526_0007"
down_revision = "20260526_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_message",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, server_default=sa.text("false"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("contact_message")
