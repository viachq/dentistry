"""Create before_after_case table."""
from alembic import op
import sqlalchemy as sa

revision = "20260526_0006"
down_revision = "20260526_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "before_after_case",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "doctor_id",
            sa.Integer,
            sa.ForeignKey("doctorprofile.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("before_image_url", sa.String(500), nullable=False),
        sa.Column("after_image_url", sa.String(500), nullable=False),
        sa.Column("is_published", sa.Boolean, server_default=sa.text("true"), nullable=False),
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
    op.drop_table("before_after_case")
