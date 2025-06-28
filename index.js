require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const path = require('path')
const app = express()
const PORT = 3000

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

/**
 * 1. create base62
 * 2. convert decimal to base62
 * 3. encodeBase62 function
 * 4. POST /api/shorten
 * 4.1 check if URL exists
 * 4.2 if exists, return existing short URL
 * 4.3 if not, insert new URL into DB
 * 4.4 generate short key using encodeBase62
 * 4.5 update row with short_key
 * 4.6 return short URL
 * 4.7 error handling
 * 5. GET /:shortKey
 * 5.1 find long URL by shortKey
 * 5.2 if found, redirect to long URL
 * 5.3 if not found, return 404
 * 5.4 error handling
 * 6. Redirect to long URL
 * 7. Error handling
 */

// Base62 character set
// Base62 => a-z, A-Z, and 0-9.
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Converts a decimal number to Base62 string.
 * @param {number} num - The decimal number to convert.
 * @returns {string} Base62 encoded string.
 */
function encodeBase62(num) {
  let str = ''
  do {
    str = BASE62[num % 62] + str
    num = Math.floor(num / 62)
  } while (num > 0)
  return str
}

/**
 * POST /api/shorten
 * Request body: { "url": "https://long-url.com" }
 * Returns: { "short_url": "http://localhost:3000/abc123" }
 */
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' })
  }
  try {
    // Check if URL already exists
    const existing = await pool.query(
      'SELECT short_key FROM short_urls WHERE long_url = $1',
      [url]
    )

    if (existing.rows.length > 0) {
      return res.json({
        short_url: `http://localhost:${PORT}/${existing.rows[0].short_key}`,
      })
    }

    // Insert new URL
    const insert = await pool.query(
      'INSERT INTO short_urls (long_url) VALUES ($1) RETURNING id',
      [url]
    )

    const id = insert.rows[0].id
    const shortKey = encodeBase62(id)

    // Update row with short_key
    await pool.query('UPDATE short_urls SET short_key = $1 WHERE id = $2', [
      shortKey,
      id,
    ])

    res.json({ short_url: `http://localhost:${PORT}/${shortKey}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error.' })
  }
})

/**
 * GET /:shortKey
 * Redirects to the original long URL if found.
 */
app.get('/:shortKey', async (req, res) => {
  const { shortKey } = req.params
  try {
    const result = await pool.query(
      'SELECT long_url FROM short_urls WHERE short_key = $1',
      [shortKey]
    )

    if (result.rows.length === 0) {
      return res.status(404).send('Short URL not found.')
    }

    res.redirect(302, result.rows[0].long_url)
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal server error.')
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
