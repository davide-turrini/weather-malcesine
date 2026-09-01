import type { LogEntry, Logger, LoggerOpts, LogLevel, LogMeta } from '@/types'

export type { LogEntry, Logger, LoggerOpts, LogLevel, LogMeta }

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function toConsole(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.service}] [${entry.level.toUpperCase()}]`
  const args: unknown[] = entry.meta ? [prefix, entry.message, entry.meta] : [prefix, entry.message]
  if (entry.level === 'error') console.error(...args)
  else if (entry.level === 'warn') console.warn(...args)
  else console.log(...args)
}

export function useLogger(opts: LoggerOpts): Logger {
  const { service, url, minLevel = 'info' } = opts
  const _isDev = process.env.NODE_ENV !== 'production'

  const buffer: LogEntry[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleFlush(): void {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      flush().catch(() => {})
    }, 2_000)
  }

  async function flush(): Promise<void> {
    if (!url || buffer.length === 0) return
    const batch = buffer.splice(0, 100)
    try {
      await fetch(`${url}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
    } catch {
      // fire and forget — se il logger è giù non crasha l'app
    }
  }

  function log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return
    const entry: LogEntry = { service, level, message, meta, timestamp: new Date().toISOString() }
    toConsole(entry)
    if (url) {
      buffer.push(entry)
      scheduleFlush()
    }
  }

  return {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    flush,
  }
}
