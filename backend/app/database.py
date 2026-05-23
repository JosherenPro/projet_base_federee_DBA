from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

pg_engine = create_async_engine(
    settings.DATABASE_URL_POSTGRES,
    echo=settings.DEBUG
)

mysql_engine = create_async_engine(
    settings.DATABASE_URL_MYSQL,
    echo=settings.DEBUG
)

pg_session_factory = async_sessionmaker(
    pg_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

mysql_session_factory = async_sessionmaker(
    mysql_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_pg_session() -> AsyncSession:
    async with pg_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def get_mysql_session() -> AsyncSession:
    async with mysql_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def close_connections():
    await pg_engine.dispose()
    await mysql_engine.dispose()
