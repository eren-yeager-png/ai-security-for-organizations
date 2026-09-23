"""add authentication audit events

Revision ID: 6b2e9f4d7c31
Revises: 4e8f7f1c2a10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6b2e9f4d7c31"
down_revision: Union[str, Sequence[str], None] = "4e8f7f1c2a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_audit_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_auth_audit_events_event", "auth_audit_events", ["event"], unique=False)
    op.create_index("ix_auth_audit_events_user_id", "auth_audit_events", ["user_id"], unique=False)
    op.create_index("ix_auth_audit_events_created_at", "auth_audit_events", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_auth_audit_events_created_at", table_name="auth_audit_events")
    op.drop_index("ix_auth_audit_events_user_id", table_name="auth_audit_events")
    op.drop_index("ix_auth_audit_events_event", table_name="auth_audit_events")
    op.drop_table("auth_audit_events")