type DatabaseLike = {
  heartbeat: (service: string, instanceId: string, meta?: Record<string, unknown>) => Promise<void>
}

export function useHeartbeat({
  db,
  service,
  instanceId,
  meta,
  intervalMs = 10_000,
}: {
  db: DatabaseLike
  service: string
  instanceId: string
  meta?: Record<string, unknown>
  intervalMs?: number
}): void {
  const beat = () => db.heartbeat(service, instanceId, meta).catch(() => {})
  beat()
  setInterval(beat, intervalMs).unref()
}
