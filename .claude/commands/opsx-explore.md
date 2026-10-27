# /opsx:explore

Explora un tema antes de comprometerte a un change. Modo thinking partner, sin implementación.

## Uso
```
/opsx:explore [tema]
```

## Qué hace
1. Invoca skill `openspec-explore` con el tema
2. Analiza código existente, KB, CHANGES.md
3. Devuelve hallazgos, riesgos, preguntas abiertas
4. NO crea artifacts ni cambia código

## Ejemplos
```
/opsx:explore "cómo manejar leads duplicados en Supabase"
/opsx:explore "mejor estrategia de caching para catálogo en Vercel"
/opsx:explore "RLS policies para multi-tenant en Instancia 2"
```