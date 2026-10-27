# /opsx:sync

Sincroniza delta specs de un change a main specs SIN archivar el change.

## Uso
```
/opsx:sync <nombre-change>
```

## Qué hace
1. Invoca skill `openspec-sync-specs` con el nombre del change
2. Mergea `openspec/changes/<nombre>/specs/` → `openspec/specs/<capability>/spec.md`
3. El change sigue activo (puedes seguir iterando)

## Cuándo usar
- Querés actualizar specs principales antes de terminar todas las tasks
- Necesitás que otros changes vean los specs actualizados
- Work en paralelo sobre misma capability

## Ejemplos
```
/opsx:sync C-03-catalog-products
/opsx:sync C-08-admin-panel
```