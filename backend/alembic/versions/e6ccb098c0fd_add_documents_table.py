"""add documents table

Revision ID: e6ccb098c0fd
Revises: 6b2e9f4d7c31
Create Date: 2026-10-05 10:58:11.464708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6ccb098c0fd"
down_revision: Union[str, Sequence[str], None] = "6b2e9f4d7c31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("classification", sa.String(length=32), nullable=False),
        sa.Column("source_type", sa.String(length=16), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_documents_classification"),
        "documents",
        ["classification"],
        unique=False,
    )

    op.create_index(
        op.f("ix_documents_created_by"),
        "documents",
        ["created_by"],
        unique=False,
    )

    op.create_index(
        op.f("ix_documents_status"),
        "documents",
        ["status"],
        unique=False,
    )

    op.create_index(
        op.f("ix_documents_title"),
        "documents",
        ["title"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_documents_title"),
        table_name="documents",
    )

    op.drop_index(
        op.f("ix_documents_status"),
        table_name="documents",
    )

    op.drop_index(
        op.f("ix_documents_created_by"),
        table_name="documents",
    )

    op.drop_index(
        op.f("ix_documents_classification"),
        table_name="documents",
    )

    op.drop_table("documents")