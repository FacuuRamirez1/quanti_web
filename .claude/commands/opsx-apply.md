# /opsx:apply

Implementa las tasks de un change existente.

## Uso
```
/opsx:apply <nombre-change>
```

## Qué hace
1. `openspec status --change "<nombre>" --json` → ve artifacts y `applyRequires`
2. Invoca skill `openspec-apply-change` con el nombre del change
3. Ejecuta tasks en orden (respeta dependencias entre tasks)
4. Carga skills de dominio según tasks (frontend, backend, deploy)
5. Strict TDD Mode: RED → GREEN → TRIANGULATE → REFACTOR por task
6. Marca tasks `[x]` en `tasks.md` conforme se completan

## Requisitos
- Change debe tener `proposal.md`, `design.md`, `tasks.md` (ver `openspec status`)
- `applyRequires` satisfecho

## Flujo TDD (Strict TDD Mode activado)
```
Por CADA task:
0. SAFETY NET: tests existentes → baseline
1. UNDERSTAND: leer task + spec scenarios + design decisions + código existente
2. RED: test que falla ANTES de código producción
3. GREEN: código mínimo para pasar test
4. TRIANGULATE: 2+ casos test (happy path + edge case)
5. REFACTOR: mejorar sin cambiar behavior (tests green tras cada paso)
6. Marcar [x]
```

## Ejemplos
```
/opsx:apply C-01-foundation-infra
/opsx:apply C-04-leads-form
```