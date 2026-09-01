export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogMeta extends Record<string, unknown> {}

export interface LogEntry {
  service: string
  level: LogLevel
  message: string
  meta?: LogMeta
  timestamp: string
}

export interface LoggerOpts {
  service: string
  url?: string
  minLevel?: LogLevel
}

export interface Logger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, meta?: LogMeta): void
  flush(): Promise<void>
}
