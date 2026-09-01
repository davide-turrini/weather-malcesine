import { z } from 'zod'

export function useEnv<T extends z.ZodRawShape>(shape: T): z.infer<z.ZodObject<T>> {
  const parsed = z.object(shape).safeParse(process.env)
  if (!parsed.success) {
    console.error("Variabili d'ambiente non valide:")
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}
