import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from '@/env'
import type { LogEntry } from '@/types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function filePath(service: string, date: string): string {
  return join(env.LOGGER_DATA_DIR, date, `${service}.jsonl`)
}

export async function flushToDisk(entries: LogEntry[]): Promise<void> {
  const date = today()

  const byService = new Map<string, LogEntry[]>()
  for (const entry of entries) {
    const svc = entry.service || 'unknown'
    const list = byService.get(svc)
    if (list) list.push(entry)
    else byService.set(svc, [entry])
  }

  for (const [service, svcEntries] of byService) {
    const path = filePath(service, date)
    await mkdir(join(env.LOGGER_DATA_DIR, date), { recursive: true })
    const lines = `${svcEntries.map((e) => JSON.stringify(e)).join('\n')}\n`
    await appendFile(path, lines, 'utf8')
  }
}

export function startFlusher(drain: () => LogEntry[]): void {
  setInterval(() => {
    const entries = drain()
    if (entries.length === 0) return
    flushToDisk(entries).catch((err) => console.error('[logger] flush su disco fallito:', err))
  }, env.LOGGER_FLUSH_INTERVAL_MS)
}
