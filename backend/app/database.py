from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Use psycopg2 (no need to modify URL, it's the default)
database_url = settings.DATABASE_URL

# Create engine with connection pool settings
engine = create_engine(
    database_url,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,         # Number of connections to maintain
    max_overflow=10      # Max additional connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
