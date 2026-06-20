import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.config import settings
from app.models.user import User
from app.models.organization import Organization
from app.models.item import Item
from app.models.party import Party
from app.services.auth_service import hash_password

async def seed():
    engine = create_async_engine(settings.async_database_url, echo=False)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with SessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "admin@testcompay.com"))
        user = res.scalar_one_or_none()
        if user:
            print("User admin@testcompay.com already exists. Updating items and customers if needed...")
            org_id = user.organization_id
        else:
            print("Creating Organization...")
            org_id = uuid.uuid4()
            org = Organization(
                id=org_id,
                name="nxtwave",
                invoice_prefix="INV",
                quotation_prefix="QUO"
            )
            db.add(org)
            await db.flush()

            print("Creating User...")
            user_id = uuid.uuid4()
            user = User(
                id=user_id,
                organization_id=org_id,
                role="admin",
                name="Admin",
                email="admin@testcompay.com",
                password_hash=hash_password("Test@1234"),
                is_active=True
            )
            db.add(user)

        print("Creating Items (Services)...")
        res = await db.execute(select(Item).where(Item.organization_id == org_id, Item.name == "dsa course"))
        if not res.scalar_one_or_none():
            items = [
                Item(id=uuid.uuid4(), organization_id=org_id, type="service", name="dsa course", sale_price=5000, gst_rate=18),
                Item(id=uuid.uuid4(), organization_id=org_id, type="service", name="sdi course", sale_price=8000, gst_rate=18),
            ]
            db.add_all(items)

        print("Creating Dummy Students (Customers)...")
        res = await db.execute(select(Party).where(Party.organization_id == org_id, Party.business_name == "John Doe"))
        if not res.scalar_one_or_none():
            customers = [
                Party(id=uuid.uuid4(), organization_id=org_id, type="customer", business_name="John Doe", email="john@example.com", phone="1234567890"),
                Party(id=uuid.uuid4(), organization_id=org_id, type="customer", business_name="Jane Smith", email="jane@example.com", phone="0987654321"),
                Party(id=uuid.uuid4(), organization_id=org_id, type="customer", business_name="Rahul Kumar", email="rahul@example.com", phone="1122334455"),
            ]
            db.add_all(customers)

        await db.commit()
        print("Successfully seeded the database!")

if __name__ == "__main__":
    asyncio.run(seed())
