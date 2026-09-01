export interface LogEntry {
  service: string
  level: string
  message: string
  meta?: unknown
  timestamp: string
}
