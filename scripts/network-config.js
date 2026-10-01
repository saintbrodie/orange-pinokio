function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim())
}

function parsePort(value, fallback = 7070) {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  if (!/^\d+$/.test(raw)) {
    throw new Error(`ORANGE_PORT must be a number between 1 and 65535, got: ${raw}`)
  }
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`ORANGE_PORT must be between 1 and 65535, got: ${raw}`)
  }
  return port
}

function formatUrlHost(host) {
  if (host.includes(':') && !host.startsWith('[')) return `[${host}]`
  return host
}

function resolveNetworkConfig(env = process.env) {
  const shareLocal = isTruthy(env.PINOKIO_SHARE_LOCAL)
  const requestedHost = String(env.ORANGE_HOST || '').trim()
  const bindHost = requestedHost || (shareLocal ? '0.0.0.0' : '127.0.0.1')
  const port = parsePort(env.ORANGE_PORT, 7070)

  if (/\s/.test(bindHost)) {
    throw new Error(`ORANGE_HOST must be a hostname or IP address without spaces, got: ${bindHost}`)
  }

  const wildcard = bindHost === '0.0.0.0' || bindHost === '::' || bindHost === '[::]'
  const openHost = wildcard ? '127.0.0.1' : bindHost
  const localUrl = `http://${formatUrlHost(openHost)}:${port}`

  return {
    shareLocal,
    bindHost,
    port,
    openHost,
    localUrl,
  }
}

module.exports = {
  isTruthy,
  parsePort,
  resolveNetworkConfig,
}
