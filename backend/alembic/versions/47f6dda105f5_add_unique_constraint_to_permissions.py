"""add unique constraint to permissions

Revision ID: 47f6dda105f5
Revises: 5212a1052011
Create Date: 2026-10-06 13:52:53.852330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47f6dda105f5'
down_revision: Union[str, Sequence[str], None] = '5212a1052011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

from alembic import op


revision = "47f6dda105f5"
down_revision = "5212a1052011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_permissions_document_user",
        "permissions",
        ["document_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_permissions_document_user",
        "permissions",
        type_="unique",
    )