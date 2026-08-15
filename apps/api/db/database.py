from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import ssl as ssl_lib
import os

RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./interviewforge.db")


def _normalize_db_url(url: str) -> tuple[str, dict]:
    """
    Accept any common Postgres URL shape (postgres://, postgresql://, with or
    without +asyncpg) and return an async-driver URL plus connect_args.

    Hosted Postgres (Neon, Supabase, Render external) hands out libpq-style URLs
    with ?sslmode=require&channel_binding=... which the asyncpg driver does NOT
    understand. We strip those params and drive SSL via connect_args instead.

    SSL is enabled only for public hostnames (they contain a dot, e.g. Neon /
    Render's *.oregon-postgres.render.com). Render's INTERNAL hostnames are a
    bare label like `dpg-xxxxx-a` on a private network and speak plaintext, so we
    let asyncpg negotiate without a forced SSL context there.
    """
    if url.startswith("postgres"):
        if "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        parts = urlsplit(url)
        query = [(k, v) for k, v in parse_qsl(parts.query) if k not in ("sslmode", "channel_binding")]
        url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
        host = parts.hostname or ""
        if "." in host:
            # Encrypt without strict cert verification — maximally compatible
            # across managed providers while still using TLS on public networks.
            ctx = ssl_lib.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl_lib.CERT_NONE
            return url, {"ssl": ctx}
        return url, {}
    return url, {}


DATABASE_URL, _connect_args = _normalize_db_url(RAW_DATABASE_URL)

# pool_pre_ping guards against serverless Postgres (e.g. Neon) dropping idle
# connections; it revalidates a connection before handing it out.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    # Import models so their tables are registered on Base.metadata before create_all.
    from models import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
