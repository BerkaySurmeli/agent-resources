from enum import Enum
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from sqlalchemy.dialects.postgresql import ARRAY, TEXT

# Enums matching SQL
class ProductCategory(str, Enum):
    PERSONA = "persona"
    SKILL = "skill"
    MCP_SERVER = "mcp_server"
    BUNDLE = "bundle"

class PrivacyLevel(str, Enum):
    LOCAL = "local"
    HYBRID = "hybrid"
    CLOUD = "cloud"

# 1. USER
class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    is_developer: bool = Field(default=False)
    # Email verification
    is_verified: bool = Field(default=False)
    verification_token: Optional[str] = Field(default=None, index=True)
    verification_sent_at: Optional[datetime] = Field(default=None)
    stripe_connect_id: Optional[str] = Field(default=None, unique=True)
    stripe_status: str = Field(default="pending")
    stripe_charges_enabled: bool = Field(default=False)
    stripe_payouts_enabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    products: List["Product"] = Relationship(back_populates="owner")
    purchases: List["Transaction"] = Relationship(back_populates="buyer", sa_relationship_kwargs={"foreign_keys": "Transaction.buyer_id"})
    sales: List["Transaction"] = Relationship(back_populates="seller", sa_relationship_kwargs={"foreign_keys": "Transaction.seller_id"})
    reviews: List["Review"] = Relationship(back_populates="user")

# 2. PRODUCT
class Product(SQLModel, table=True):
    __tablename__ = "products"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id")
    name: str
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = None
    category: str
    category_tags: List[str] = Field(sa_column=Column(ARRAY(TEXT), default=[]))
    privacy_level: str = Field(default='local')
    price_cents: int = Field(default=0)
    one_click_json: Dict = Field(default={}, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    download_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    owner: User = Relationship(back_populates="products")
    versions: List["Version"] = Relationship(back_populates="product")
    mcp_details: List["MCPDetail"] = Relationship(back_populates="product")
    transactions: List["Transaction"] = Relationship(back_populates="product")
    reviews: List["Review"] = Relationship(back_populates="product")

# 3. VERSION
class Version(SQLModel, table=True):
    __tablename__ = "versions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    product_id: UUID = Field(foreign_key="products.id")
    semver: str
    mcp_manifest: Dict = Field(sa_column=Column(JSON))
    download_url: str
    compatibility_matrix: Dict = Field(default={}, sa_column=Column(JSON))
    checksum: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    product: Product = Relationship(back_populates="versions")
    mcp_details: List["MCPDetail"] = Relationship(back_populates="version")

# 4. MCP_DETAIL
class MCPDetail(SQLModel, table=True):
    __tablename__ = "mcp_details"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    product_id: UUID = Field(foreign_key="products.id")
    version_id: UUID = Field(foreign_key="versions.id")
    command: str
    args: List[str] = Field(sa_column=Column(ARRAY(TEXT), default=[]))
    env_vars_required: List[str] = Field(sa_column=Column(ARRAY(TEXT), default=[]))
    manifest_url: Optional[str] = None
    runtime_env: str
    memory_limit_mb: int = Field(default=512)
    timeout_seconds: int = Field(default=30)
    
    # Relationships
    product: Product = Relationship(back_populates="mcp_details")
    version: Version = Relationship(back_populates="mcp_details")

# 5. TRANSACTION
class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    buyer_id: UUID = Field(foreign_key="users.id")
    seller_id: UUID = Field(foreign_key="users.id")
    product_id: UUID = Field(foreign_key="products.id")
    amount_cents: int
    platform_fee_cents: int
    stripe_payment_intent_id: str = Field(unique=True)
    stripe_transfer_id: Optional[str] = Field(default=None, unique=True)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    buyer: User = Relationship(back_populates="purchases", sa_relationship_kwargs={"foreign_keys": "Transaction.buyer_id"})
    seller: User = Relationship(back_populates="sales", sa_relationship_kwargs={"foreign_keys": "Transaction.seller_id"})
    product: Product = Relationship(back_populates="transactions")

# 6. REVIEW
class Review(SQLModel, table=True):
    __tablename__ = "reviews"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    product_id: UUID = Field(foreign_key="products.id")
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    is_verified_purchase: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="reviews")
    product: Product = Relationship(back_populates="reviews")

# 7. WAITLIST
class WaitlistEntry(SQLModel, table=True):
    __tablename__ = "waitlist"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    source: str = Field(default="website")  # where they signed up
    created_at: datetime = Field(default_factory=datetime.utcnow)


# 8. LISTING (for seller submissions with security scanning)
class ListingStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"  # Waiting for listing fee
    PENDING_SCAN = "pending_scan"        # Payment received, waiting for security scan
    SCANNING = "scanning"                # Security scan in progress
    APPROVED = "approved"                # Approved and published
    REJECTED = "rejected"                # Failed security scan
    PAYMENT_FAILED = "payment_failed"    # Payment failed

class Listing(SQLModel, table=True):
    __tablename__ = "listings"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id")
    
    # Listing details
    name: str
    slug: str = Field(unique=True, index=True)
    description: str
    category: str
    category_tags: List[str] = Field(sa_column=Column(ARRAY(TEXT), default=[]))
    price_cents: int
    
    # File storage
    file_path: str  # Path to stored ZIP file
    file_size_bytes: int
    file_count: int
    
    # Security scan
    status: str = Field(default='pending_payment')
    scan_started_at: Optional[datetime] = Field(default=None)
    scan_completed_at: Optional[datetime] = Field(default=None)
    scan_results: Dict = Field(default={}, sa_column=Column(JSON))
    virustotal_report: Optional[str] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None)
    
    # Payment
    listing_fee_cents: int = Field(default=0)  # 0 for first 500
    payment_intent_id: Optional[str] = Field(default=None)
    payment_status: str = Field(default="pending")  # pending, succeeded, failed
    
    # Published product (once approved)
    product_id: Optional[UUID] = Field(default=None, foreign_key="products.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    owner: User = Relationship()
    product: Optional[Product] = Relationship()
