## PostgreSQL Table Schema

```sql
CREATE TABLE short_urls (
    id BIGSERIAL PRIMARY KEY,
    long_url TEXT NOT NULL,
    short_key VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

```
CREATE UNIQUE INDEX idx_short_key ON short_urls(short_key);
```

## Environment Variables

Create a `.env` file in the project root with your PostgreSQL connection string:

```
DATABASE_URL=postgres://user:password@localhost:5432/database
```

Replace `user`, `password`, and `database` with your actual PostgreSQL credentials and database name.
