import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import process from 'process'

const dataFile = path.resolve(process.cwd(), 'data/subscribers.json')

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

function parseSubscriberText(text) {
  const simpleMatch = /subscriberCountText\s*:\s*\{\s*simpleText\s*:\s*"([^"]+)"/i.exec(text)
  if (simpleMatch) return simpleMatch[1]

  const labelMatch = /subscriberCountText\s*:\s*\{[^}]*accessibility\s*:\s*\{[^}]*label\s*:\s*"([^"]+)"/i.exec(text)
  if (labelMatch) return labelMatch[1]

  const altMatch = /"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/i.exec(text)
  if (altMatch) return altMatch[1]

  return null
}

function parseCount(value) {
  if (!value) return null

  const trimmed = value.replace(/subscribers?/i, '').trim()
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

function extractSubscriberCount(html) {
  const jsonMatch = /var ytInitialData = (\{.+?\});<\//s.exec(html)
  if (jsonMatch) {
    const found = parseSubscriberText(jsonMatch[1])
    if (found) return parseCount(found)
  }

  const embeddedMatch = /"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/i.exec(html)
  if (embeddedMatch) return parseCount(embeddedMatch[1])

  const labelMatch = /"subscriberCountText"\s*:\s*\{[^}]*"accessibility"\s*:\s*\{[^}]*"label"\s*:\s*"([^"]+)"/i.exec(html)
  if (labelMatch) return parseCount(labelMatch[1])

  return null
}

async function main() {
  const url = getChannelUrl()
  console.log(`Fetching subscriber count from: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GitHubActions/1.0; +https://github.com)',
      Accept: 'text/html,application/xhtml+xml'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch channel page: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const subscriberCount = extractSubscriberCount(html)
  if (subscriberCount === null) {
    throw new Error('Unable to extract subscriber count from the YouTube channel page.')
  }

  console.log(`Parsed subscriber count: ${subscriberCount}`)

  const updatedAt = new Date().toISOString()
  const payload = { subscriberCount, updatedAt }

  await writeFile(dataFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`Updated ${dataFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
