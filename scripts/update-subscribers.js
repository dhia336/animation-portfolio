import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import process from 'process'

// Resolve a repository-root-relative path for the subscribers JSON so this
// script behaves the same whether it's invoked from the repo root or from
// the `scripts/` directory (CI runners often run workflows from different
// working directories). Allow overriding via `SUBSCRIBERS_JSON_PATH` env var.
const scriptDir = path.dirname(new URL(import.meta.url).pathname)
const repoRoot = path.resolve(scriptDir, '..')
const dataFile = process.env.SUBSCRIBERS_JSON_PATH
  ? path.resolve(process.env.SUBSCRIBERS_JSON_PATH)
  : path.resolve(repoRoot, 'Frontend', 'data', 'subscribers.json')

function getChannelUrl() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim()
  let channelUrl = process.env.YOUTUBE_CHANNEL_URL?.trim()

  if (!channelId && !channelUrl) {
    throw new Error('Missing environment variables. Define YOUTUBE_CHANNEL_ID or YOUTUBE_CHANNEL_URL.')
  }

  if (channelId) {
    return `https://www.youtube.com/channel/${channelId}/about`
  }

  if (!/^https?:\/\//i.test(channelUrl)) {
    channelUrl = `https://${channelUrl}`
  }

  if (!channelUrl.endsWith('/about')) {
    channelUrl = channelUrl.replace(/\/+$/, '') + '/about'
  }

  return channelUrl
}

function parseCount(value) {
  if (!value) return null

  // Normalize non-breaking spaces and the word "subscribers" out of the string.
  const trimmed = value.replace(/\u00a0/g, ' ').replace(/subscribers?/i, '').trim()
  const normalized = trimmed.replace(/,/g, '').trim()
  const countMatch = /^([\d.]+)\s*([kKmMbBtT]?)/.exec(normalized)
  if (!countMatch) return null

  const number = Number(countMatch[1])
  if (Number.isNaN(number)) return null

  const unit = countMatch[2].toLowerCase()
  const multipliers = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12
  }

  return unit ? Math.round(number * (multipliers[unit] ?? 1)) : Math.round(number)
}

// Multiple patterns, tried in order, since YouTube's channel-page markup has
// changed shape more than once (legacy c4TabbedHeaderRenderer vs the newer
// pageHeaderRenderer/pageHeaderViewModel layout) and can differ by locale or
// A/B test. Matching directly against the raw HTML (rather than first trying
// to isolate and JSON.parse a `ytInitialData` blob) avoids a lazy-regex
// truncation bug where the blob gets cut off before the field we want.
const SUBSCRIBER_PATTERNS = [
  // Legacy: "subscriberCountText":{"simpleText":"530 subscribers"}
  /"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/i,
  // Legacy accessibility label variant
  /"subscriberCountText"\s*:\s*\{[^}]*"accessibility"\s*:\s*\{[^}]*"label"\s*:\s*"([^"]+)"/i,
  // Newer pageHeaderViewModel metadata rows: {"text":{"content":"530 subscribers"}}
  /"text"\s*:\s*\{\s*"content"\s*:\s*"([\d.,\u00a0\s]+[KMBTkmbt]?\s*subscribers?)"\s*\}/i,
  // Loosest fallback: any quoted "content" field mentioning subscribers
  /"content"\s*:\s*"([\d.,\u00a0\s]+[KMBTkmbt]?\s*subscribers?)"/i,
  // og/meta description sometimes carries it too, e.g. "1.2K subscribers • 12 videos"
  /<meta[^>]+name="description"[^>]+content="([\d.,\u00a0\s]+[KMBTkmbt]?\s*subscribers?)/i
]

function extractSubscriberCount(html) {
  for (const pattern of SUBSCRIBER_PATTERNS) {
    const match = pattern.exec(html)
    if (match) {
      const count = parseCount(match[1])
      if (count !== null) return count
    }
  }
  return null
}

function looksLikeConsentWall(html) {
  return /consent\.youtube\.com/i.test(html) || /Before you continue to YouTube/i.test(html)
}

async function main() {
  const url = getChannelUrl()
  console.log(`Fetching subscriber count from: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      // Skips the EU/GDPR cookie-consent redirect page, which serves
      // completely different HTML with no subscriber data in it.
      Cookie: 'CONSENT=YES+1; SOCS=CAI'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch channel page: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()

  if (looksLikeConsentWall(html)) {
    throw new Error(
      'Received a cookie-consent page instead of the channel page. The Cookie header workaround may need updating.'
    )
  }

  const subscriberCount = extractSubscriberCount(html)
  if (subscriberCount === null) {
    // Log enough to diagnose without dumping the whole (large) page.
    console.error(`Response length: ${html.length} chars`)
    console.error(`Excerpt: ${html.slice(0, 300).replace(/\s+/g, ' ')}`)
    throw new Error(
      'Unable to extract subscriber count from the YouTube channel page. YouTube likely changed its markup again — see the excerpt above and update SUBSCRIBER_PATTERNS in this script.'
    )
  }

  console.log(`Parsed subscriber count: ${subscriberCount}`)

  const updatedAt = new Date().toISOString()
  const payload = { subscriberCount, updatedAt }

  // Ensure the target directory exists before attempting to write.
  const targetDir = path.dirname(dataFile)
  await mkdir(targetDir, { recursive: true })

  await writeFile(dataFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`Updated ${dataFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
