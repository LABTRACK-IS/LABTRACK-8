import os
import time
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger("labtrack.postgres")

try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False

_CACHE_STATE: Optional[Dict[str, Any]] = None
_CACHE_TS: float = 0.0

def get_dsn() -> str:
    env = os.getenv("DATABASE_URL")
    if env and env.startswith("postgres"):
        return env.replace("+asyncpg", "")
    return f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

async def fetch_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    if not HAS_ASYNCPG:
        return []
    try:
        conn = await asyncpg.connect(get_dsn(), timeout=4)
        try:
            rows = await conn.fetch(sql, *params)
            return [dict(r) for r in rows]
        finally:
            await conn.close()
    except Exception as exc:
        logger.debug(f"Query execution note: {exc}")
        return []

async def execute_query(sql: str, params: tuple = ()) -> bool:
    if not HAS_ASYNCPG:
        return False
    try:
        conn = await asyncpg.connect(get_dsn(), timeout=4)
        try:
            await conn.execute(sql, *params)
            return True
        finally:
            await conn.close()
    except Exception as exc:
        logger.debug(f"Execute note: {exc}")
        return False

async def resolve_table_fqn(table_name: str) -> Optional[str]:
    rows = await fetch_query(
        "SELECT table_schema, table_name FROM information_schema.tables "
        "WHERE table_schema IN ('labtrack_schema', 'public') AND LOWER(table_name) = LOWER($1) LIMIT 1",
        (table_name,)
    )
    if rows:
        s_name = rows[0]["table_schema"]
        t_name = rows[0]["table_name"]
        return f'{s_name}."{t_name}"'
    return None

async def count_rows(table_name: str, where_clause: Optional[str] = None, params: tuple = ()) -> Optional[int]:
    fqn = await resolve_table_fqn(table_name)
    if not fqn:
        return None
    sql = f"SELECT COUNT(*) AS c FROM {fqn}"
    if where_clause:
        sql += f" WHERE {where_clause}"
    rows = await fetch_query(sql, params)
    if rows and rows[0].get("c") is not None:
        return int(rows[0]["c"])
    return None

async def introspect_full_database(force_refresh: bool = False) -> Dict[str, Any]:
    global _CACHE_STATE, _CACHE_TS
    now = time.perf_counter()
    if not force_refresh and _CACHE_STATE is not None and (now - _CACHE_TS) < 2.5:
        return _CACHE_STATE

    if not HAS_ASYNCPG:
        return {"tables": {}, "roles": {}, "financial_totals": {}, "samples": {}, "timestamp": datetime.utcnow().isoformat()}

    counts: Dict[str, int] = {}
    samples: Dict[str, List[Dict[str, Any]]] = {}
    financials: Dict[str, float] = {}
    roles: Dict[str, int] = {}

    try:
        conn = await asyncpg.connect(get_dsn(), timeout=4)
        try:
            tables = await conn.fetch(
                "SELECT table_schema, table_name FROM information_schema.tables "
                "WHERE table_schema IN ('labtrack_schema', 'public') AND table_type = 'BASE TABLE' ORDER BY table_name"
            )
            for tbl in tables:
                s_name = tbl["table_schema"]
                t_name = tbl["table_name"]
                if t_name.startswith("__"):
                    continue
                fqn = f'{s_name}."{t_name}"'
                try:
                    cnt_val = await conn.fetchval(f"SELECT COUNT(*) FROM {fqn}")
                    cnt = int(cnt_val or 0)
                    counts[t_name] = cnt
                    if cnt > 0 and len(samples) < 15:
                        s_rows = await conn.fetch(f"SELECT * FROM {fqn} LIMIT 5")
                        cleaned = []
                        for sr in s_rows:
                            d_row = dict(sr)
                            cleaned.append({k: str(v) for k, v in d_row.items() if all(x not in k.lower() for x in ("password", "hash", "secret", "token", "stamp", "embedding")) and v is not None})
                        samples[t_name] = cleaned
                except Exception:
                    counts[t_name] = 0

                if t_name.lower() == "users":
                    try:
                        r_rows = await conn.fetch(f'SELECT UPPER(CAST("Role" AS TEXT)) AS r, COUNT(*) AS c FROM {fqn} GROUP BY UPPER(CAST("Role" AS TEXT))')
                        for rr in r_rows:
                            roles[str(rr["r"] or "UNKNOWN")] = int(rr["c"] or 0)
                    except Exception:
                        pass

                if any(k in t_name.lower() for k in ("financial", "expense", "transaction", "replacement", "maintenance", "repair")):
                    cols = await conn.fetch(
                        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
                        s_name, t_name
                    )
                    for col in cols:
                        cname = col["column_name"]
                        dtype = col["data_type"]
                        if dtype in ("numeric", "decimal", "double precision", "real") and any(k in cname.lower() for k in ("cost", "amount", "price", "expense", "budget", "value")):
                            try:
                                total_val = await conn.fetchval(f'SELECT COALESCE(SUM("{cname}"), 0) FROM {fqn}')
                                financials[f"{t_name}.{cname}"] = float(total_val or 0.0)
                            except Exception:
                                pass
        finally:
            await conn.close()
    except Exception as exc:
        logger.debug(f"Introspection error: {exc}")

    result = {
        "tables": counts,
        "roles": roles,
        "financial_totals": financials,
        "samples": samples,
        "timestamp": datetime.utcnow().isoformat()
    }
    _CACHE_STATE = result
    _CACHE_TS = time.perf_counter()
    return result
