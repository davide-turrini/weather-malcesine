import figlet from 'figlet'

const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const COLORS = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
} as const

type Color = keyof typeof COLORS

function art(text: string): string[] {
  return figlet
    .textSync(text, { font: 'Standard' })
    .split('\n')
    .filter((l) => l.trim())
}

export function useBanner(opts: {
  service: string
  color: Color
  meta?: Record<string, string | number>
}): void {
  printBanner(opts.service, opts.color, opts.meta)
}

export function printBanner(
  service: string,
  color: Color,
  meta?: Record<string, string | number>,
): void {
  const c = COLORS[color]
  const lines = [...art('MALCESINE'), '', ...art(service)]
  const width = Math.max(
    ...lines.map((l) => l.length),
    ...Object.entries(meta ?? {}).map(([k, v]) => `${k}: ${v}`.length),
    40,
  )
  const bar = '─'.repeat(width + 4)
  const row = (content: string) => `${BOLD}${c}│  ${content.padEnd(width)}  │${RESET}`

  const out = ['', `${BOLD}${c}┌${bar}┐${RESET}`, row(''), ...lines.map(row), row('')]

  if (meta && Object.keys(meta).length > 0) {
    for (const [k, v] of Object.entries(meta)) {
      const entry = `${k}: ${v}`
      out.push(
        `${BOLD}${c}│  ${DIM}${entry}${RESET}${BOLD}${c}${''.padEnd(width - entry.length)}  │${RESET}`,
      )
    }
    out.push(row(''))
  }

  out.push(`${BOLD}${c}└${bar}┘${RESET}`, '')
  process.stdout.write(`${out.join('\n')}\n`)
}
