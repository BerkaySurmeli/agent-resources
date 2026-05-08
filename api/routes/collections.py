from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlmodel import select, func
from sqlalchemy import text
from typing import List, Optional
from uuid import UUID
import re
from models import User, Product, Collection, CollectionItem
from core.database import get_session
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/collections", tags=["Collections"])


# ── helpers ─────────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:120].strip("-")


def _unique_slug(base: str, owner_id: UUID, session, exclude_id: Optional[UUID] = None) -> str:
    slug = base or "collection"
    for suffix in [""] + [f"-{i}" for i in range(2, 20)]:
        candidate = f"{slug}{suffix}"
        q = select(Collection).where(Collection.slug == candidate)
        if exclude_id:
            q = q.where(Collection.id != exclude_id)
        if not session.exec(q).first():
            return candidate
    import os
    return f"{slug}-{os.urandom(3).hex()}"


def _can_write(collection: Collection, user: User) -> bool:
    return str(collection.owner_id) == str(user.id)


# ── schemas ──────────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    is_public: bool = True


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    is_public: Optional[bool] = None


class ItemAddRequest(BaseModel):
    product_slug: str
    note: Optional[str] = Field(default=None, max_length=280)


class ItemUpdateRequest(BaseModel):
    note: Optional[str] = Field(default=None, max_length=280)
    position: Optional[int] = None


# ── authenticated list (must be before /{slug} to avoid shadowing) ───────────

@router.get("/mine/list")
async def list_my_collections(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collections = session.exec(
        select(Collection)
        .where(Collection.owner_id == current_user.id)
        .order_by(Collection.updated_at.desc())
    ).all()

    result = []
    for c in collections:
        count = session.exec(
            select(func.count(CollectionItem.id)).where(CollectionItem.collection_id == c.id)
        ).one()
        result.append({
            "id": str(c.id),
            "slug": c.slug,
            "name": c.name,
            "description": c.description,
            "is_public": c.is_public,
            "item_count": count,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    return result


# ── public endpoints ─────────────────────────────────────────────────────────

@router.get("/{slug}")
async def get_collection(slug: str, request: Request, session = Depends(get_session)):
    """Get a collection with its items. Private collections are accessible only by their owner."""
    from fastapi.security.utils import get_authorization_scheme_param
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not collection.is_public:
        # Allow owner access via Bearer token
        auth_header = request.headers.get("Authorization", "")
        scheme, token_str = get_authorization_scheme_param(auth_header)
        owner_id = None
        if scheme.lower() == "bearer" and token_str:
            from jose import jwt as _jwt, JWTError
            from core.config import settings as _s
            try:
                payload = _jwt.decode(token_str, _s.SECRET_KEY, algorithms=["HS256"])
                sub = payload.get("sub")
                # Verify the user still exists in the DB
                if sub and str(collection.owner_id) == sub:
                    from uuid import UUID as _UUID
                    if session.get(User, _UUID(sub)):
                        owner_id = sub
            except (JWTError, Exception):
                pass
        if not owner_id:
            raise HTTPException(status_code=404, detail="Collection not found")

    owner = session.get(User, collection.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Collection not found")
    items = session.exec(
        select(CollectionItem, Product)
        .join(Product, CollectionItem.product_id == Product.id)
        .where(CollectionItem.collection_id == collection.id, Product.is_active == True)
        .order_by(CollectionItem.position, CollectionItem.created_at)
    ).all()

    return {
        "id": str(collection.id),
        "slug": collection.slug,
        "name": collection.name,
        "description": collection.description,
        "is_public": collection.is_public,
        "created_at": collection.created_at,
        "owner": {
            "id": str(owner.id),
            "name": owner.name or "Anonymous",
            "profile_slug": owner.profile_slug,
            "avatar_url": owner.avatar_url,
        },
        "items": [
            {
                "id": str(ci.id),
                "position": ci.position,
                "note": ci.note,
                "product": {
                    "id": str(p.id),
                    "slug": p.slug,
                    "name": p.name,
                    "description": p.description,
                    "category": p.category,
                    "price_cents": p.price_cents,
                    "is_verified": p.is_verified,
                    "download_count": p.download_count,
                },
            }
            for ci, p in items
        ],
    }


@router.get("/by-product/{product_slug}")
async def get_collections_for_product(product_slug: str, session = Depends(get_session)):
    """Return public collections that contain a given product slug."""
    product = session.exec(select(Product).where(Product.slug == product_slug)).first()
    if not product:
        return []

    rows = session.exec(
        select(Collection, CollectionItem)
        .join(CollectionItem, CollectionItem.collection_id == Collection.id)
        .where(CollectionItem.product_id == product.id, Collection.is_public == True)
        .order_by(Collection.created_at.desc())
        .limit(10)
    ).all()

    return [
        {
            "slug": c.slug,
            "name": c.name,
            "description": c.description,
        }
        for c, _ in rows
    ]


# ── authenticated write endpoints ────────────────────────────────────────────

@router.post("")
async def create_collection(
    body: CollectionCreate,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    base = _slugify(body.name)
    slug = _unique_slug(base, current_user.id, session)
    collection = Collection(
        owner_id=current_user.id,
        name=body.name,
        slug=slug,
        description=body.description,
        is_public=body.is_public,
    )
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return {"id": str(collection.id), "slug": collection.slug, "name": collection.name}


@router.put("/{slug}")
async def update_collection(
    slug: str,
    body: CollectionUpdate,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if not _can_write(collection, current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    if body.name is not None:
        new_base = _slugify(body.name)
        if new_base != _slugify(collection.name):
            collection.slug = _unique_slug(new_base, current_user.id, session, exclude_id=collection.id)
        collection.name = body.name
    if body.description is not None:
        collection.description = body.description
    if body.is_public is not None:
        collection.is_public = body.is_public

    from datetime import datetime
    collection.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(collection)
    return {"id": str(collection.id), "slug": collection.slug, "name": collection.name}


@router.delete("/{slug}")
async def delete_collection(
    slug: str,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if not _can_write(collection, current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    # Delete items first to avoid FK violation (SQLModel doesn't auto-cascade)
    items = session.exec(select(CollectionItem).where(CollectionItem.collection_id == collection.id)).all()
    for item in items:
        session.delete(item)
    session.delete(collection)
    session.commit()
    return {"ok": True}


@router.post("/{slug}/items")
async def add_item(
    slug: str,
    body: ItemAddRequest,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if not _can_write(collection, current_user):
        raise HTTPException(status_code=403, detail="Forbidden")

    product = session.exec(select(Product).where(Product.slug == body.product_slug, Product.is_active == True)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = session.exec(
        select(CollectionItem).where(
            CollectionItem.collection_id == collection.id,
            CollectionItem.product_id == product.id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already in collection")

    max_pos = session.exec(
        select(func.coalesce(func.max(CollectionItem.position), -1))
        .where(CollectionItem.collection_id == collection.id)
    ).one()
    item = CollectionItem(
        collection_id=collection.id,
        product_id=product.id,
        note=body.note,
        position=max_pos + 1,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return {"id": str(item.id), "position": item.position}


@router.patch("/{slug}/items/{item_id}")
async def update_item(
    slug: str,
    item_id: UUID,
    body: ItemUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if not _can_write(collection, current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    item = session.get(CollectionItem, item_id)
    if not item or item.collection_id != collection.id:
        raise HTTPException(status_code=404, detail="Item not found")
    if body.note is not None:
        item.note = body.note
    if body.position is not None:
        item.position = body.position
    session.commit()
    return {"ok": True}


@router.delete("/{slug}/items/{item_id}")
async def remove_item(
    slug: str,
    item_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    collection = session.exec(select(Collection).where(Collection.slug == slug)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if not _can_write(collection, current_user):
        raise HTTPException(status_code=403, detail="Forbidden")
    item = session.get(CollectionItem, item_id)
    if not item or item.collection_id != collection.id:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
