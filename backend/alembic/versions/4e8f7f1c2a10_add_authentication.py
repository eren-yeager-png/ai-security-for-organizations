"""add authentication and rbac tables

Revision ID: 4e8f7f1c2a10
Revises: 09298a5a8e4b
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4e8f7f1c2a10"
down_revision: Union[str, Sequence[str], None] = "09298a5a8e4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=32), nullable=False, unique=True),
    )
    op.bulk_insert(sa.table("roles", sa.column("name", sa.String())), [{"name": name} for name in ("admin", "manager", "employee")])
    op.add_column("users", sa.Column("email", sa.String(length=320), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("role_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("created_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(sa.text("UPDATE users SET email = username || '@local.invalid', password_hash = '$argon2id$v=19$m=65536,t=3,p=4$4dxJ/ThztHAdp/33JqvQyw$oMUfImbO43QyW9tyLP27AdXjX9BN8opFYogBxwV1hN0', is_active = false, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE email IS NULL"))
    op.execute(sa.text("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'employee') WHERE role_id IS NULL"))
    op.alter_column("users", "username", nullable=True)
    for column_name in ("email", "password_hash", "role_id", "is_active", "created_at", "updated_at"):
        op.alter_column("users", column_name, nullable=False)
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_foreign_key("fk_users_role_id", "users", "roles", ["role_id"], ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_role_id", "users", ["role_id"], unique=False)
    op.create_table("refresh_tokens", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("token_hash", sa.String(length=128), nullable=False, unique=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True), sa.Column("replaced_by_id", sa.Integer(), sa.ForeignKey("refresh_tokens.id"), nullable=True))
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=False)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)
    op.create_table("password_reset_tokens", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("token_hash", sa.String(length=128), nullable=False, unique=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("used_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"], unique=False)
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_constraint("fk_users_role_id", "users", type_="foreignkey")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_role_id", table_name="users")
    for column_name in ("last_login_at", "updated_at", "created_at", "is_active", "role_id", "password_hash", "email"):
        op.drop_column("users", column_name)
    op.drop_table("roles")