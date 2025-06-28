# URL Shortener

A simple, URL shortener service for study purposes, using PostgreSQL for persistent storage.

## Features

- Shortens long URLs using a unique Base62-encoded key.
- Stores mappings in a PostgreSQL database.
- Prevents duplicate short URLs for the same long URL.
- Provides fast redirection using indexed keys.

## How It Works

1. **Shortening a URL:**
   - POST `/api/shorten` with `{ "url": "https://long-url.com" }`
   - If the URL was already shortened, returns the existing short URL.
   - Otherwise, inserts the URL, gets the auto-incremented ID, encodes it in Base62, updates the row, and returns the short URL.
2. **Redirection:**
   - GET `/:shortKey` redirects to the original URL using HTTP 302.
   - HTTP 302 indicates that is a temporary redirect allowing the user pass through your service, a redirect HTTP 301 (permanent) would be stored in cache by the browser and then it would not fetch your service anymore.

## Example Usage

### Shorten a URL

```
curl -X POST http://localhost:3000/api/shorten -H "Content-Type: application/json" -d '{"url": "https://www.example.com"}'
```

Response:

```
{"short_url": "http://localhost:3000/abc123"}
```

### Redirect

```
curl -v http://localhost:3000/abc123
```

Or open in your browser.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your PostgreSQL database and `.env` file (see `postgres_config.md`).
3. Start the server:
   ```bash
   node index.js
   ```

## Advanced Architecture Diagram

Below is a conceptual diagram of a scalable URL shortener architecture using modern best practices:

```
+----------------+         +-------------------+         +-------------------+
|                |         |                   |         |                   |
|  User/Browser  +-------->+   Load Balancer   +-------->+   Web Servers     |
|                |  HTTPS  | (e.g., NGINX, ELB)|  HTTP   | (Node.js/Express) |
+----------------+         +-------------------+         +-------------------+
                                                                |         |
                                                                |         |
                                                                v         v
                                                        +-----------------------+
                                                        |      Redis Cache      |
                                                        | (ShortKey -> LongURL) |
                                                        +-----------------------+
                                                                |
                                                                v
                                                        +-----------------------+
                                                        |   PostgreSQL DB       |
                                                        | (Persistent Storage)  |
                                                        +-----------------------+
```

### Components

- **User/Browser:** Sends requests to shorten or access URLs.
- **Load Balancer:** Distributes incoming traffic across multiple web servers for high availability and scalability.
- **Web Servers:** Host the Node.js/Express application. Multiple instances can run in parallel.
- **Redis Cache:** Used for extremely fast lookups of short URLs, reducing database load and latency.
- **PostgreSQL Database:** Stores all URL mappings persistently. Redis is used as a cache layer, but PostgreSQL is the source of truth.

### Flow

1. **Shorten URL:**
   - User sends a POST request to the load balancer.
   - Load balancer forwards to a web server.
   - Web server checks if the URL exists in PostgreSQL; if not, inserts and generates a short key.
   - The mapping is stored in both PostgreSQL and Redis.
2. **Redirect:**
   - User accesses a short URL.
   - Web server first checks Redis for the mapping.
   - If not found, queries PostgreSQL and updates Redis.
   - Redirects the user to the original URL.

---
