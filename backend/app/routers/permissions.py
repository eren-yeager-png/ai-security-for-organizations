from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.audit import audit_event
from app.authorization import GRANTABLE_CLASSIFICATIONS
from app.db.database import get_db
from app.db.models import Document, Permission, User
from app.deps import require_roles
from app.schemas import PermissionCreate, PermissionResponse

router = APIRouter(
    prefix="/api/v1/permissions",
    tags=["permissions"],
)


@router.post(
    "",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_permission(
    payload: PermissionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    # Check that the document exists
    document = db.get(Document, payload.document_id)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Classification is the primary access control. Explicit grants are only
    # an exception for Internal documents: Public is already readable by
    # everyone, and Confidential must stay admin-only.
    if document.classification not in GRANTABLE_CLASSIFICATIONS:
        audit_event("PERMISSION_GRANT_REJECTED", admin, result="DENIED", resource_type="document", resource_id=document.id, detail={"classification": document.classification, "target_user_id": payload.user_id})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Explicit grants are not allowed for {document.classification} documents. "
                "Access is determined by classification "
                "(Public: everyone, Internal: managers + granted users, Confidential: admins only)."
            ),
        )

    # Check that the target user exists
    user = db.get(User, payload.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check that the target user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is inactive",
        )

    # Check for an existing permission
    existing_permission = (
        db.query(Permission)
        .filter(
            Permission.document_id == payload.document_id,
            Permission.user_id == payload.user_id,
        )
        .first()
    )

    if existing_permission is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists for this user and document",
        )

    permission = Permission(
        document_id=payload.document_id,
        user_id=payload.user_id,
        permission=payload.permission,
    )

    db.add(permission)
    db.commit()
    db.refresh(permission)
    audit_event("PERMISSION_GRANTED", admin, resource_type="document", resource_id=document.id, detail={"target_user_id": payload.user_id, "permission": "read"})

    return permission


@router.get(
    "",
    response_model=list[PermissionResponse],
)
def get_permissions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    permissions = db.query(Permission).all()

    return permissions