import os
import time

import psycopg
from dotenv import load_dotenv

load_dotenv()

start = time.time()

with psycopg.connect(
    os.environ["DATABASE_URL"],
    connect_timeout=10,
    prepare_threshold=None,
) as conn:
    result = conn.execute("select count(*) from walks").fetchone()

print(result, f"{time.time() - start:.2f}s")