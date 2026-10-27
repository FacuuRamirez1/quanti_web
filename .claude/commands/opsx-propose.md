# /opsx:propose

Crea un nuevo change con todos sus artifacts: proposal, design, specs, tasks.

## Uso
```
/opsx:propose <nombre-change>
```

## Qué hace
1. Verifica dependencias en CHANGES.md
2. Invoca skill `openspec-propose` con el nombre del change
3. Genera en `openspec/changes/<nombre>/`:
   - `.openspec.yaml` (metadata)
   - `proposal.md` (qué y por qué)
   - `design.md` (cómo)
   - `tasks.md` (checklist implementación)
   - `specs/` (delta specs opcional)
4. Actualiza `openspec list`

## Requisitos previos
- Leer KB relevante para el change (ver CHANGES.md → "Leer antes")
- Resolver preguntas Alta de `knowledge-base/10_preguntas_abiertas.md` si afectan al change

## Ejemplos
```
/opsx:propose C-01-foundation-infra
/opsx:propose C-04-leads-form
/opsx:propose C-07-checkout-payment
```