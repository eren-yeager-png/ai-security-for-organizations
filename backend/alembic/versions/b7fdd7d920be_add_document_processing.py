"""add document processing (status lifecycle, PII policy, processed pages)

Revision ID: b7fdd7d920be
Revises: 47f6dda105f5
Create Date: 2026-10-07 12:12:35.338714

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7fdd7d920be"
down_revision: Union[str, Sequence[str], None] = "47f6dda105f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "document_pages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "page_number", name="uq_document_pages_document_page"),
    )
    op.create_index(op.f("ix_document_pages_document_id"), "document_pages", ["document_id"], unique=False)

    op.add_column("documents", sa.Column("stored_file_name", sa.String(length=255), nullable=True))
    op.add_column("documents", sa.Column("pii_policy", sa.String(length=16), server_default="MASK", nullable=False))
    op.add_column("documents", sa.Column("pii_summary", sa.JSON(), nullable=True))
    op.add_column("documents", sa.Column("processing_error", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True))

    # Uploads made before this migration were saved under their original
    # filename. Point stored_file_name at it so they can be (re)processed.
    # The pipeline still validates the name stays inside UPLOAD_DIR.
    op.execute(
        "UPDATE documents SET stored_file_name = file_name "
        "WHERE source_type = 'file' AND file_name IS NOT NULL AND stored_file_name IS NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("documents", "processed_at")
    op.drop_column("documents", "processing_error")
    op.drop_column("documents", "pii_summary")
    op.drop_column("documents", "pii_policy")
    op.drop_column("documents", "stored_file_name")
    op.drop_index(op.f("ix_document_pages_document_id"), table_name="document_pages")
    op.drop_table("document_pages")
