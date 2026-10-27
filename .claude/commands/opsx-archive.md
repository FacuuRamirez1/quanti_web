# /opsx:archive

Archiva un change completado: sincroniza delta specs a main specs y mueve a archive.

## Uso
```
/opsx:archive <nombre-change>
```

## Qué hace
1. Verifica que todas las tasks estén `[x]` en `tasks.md`
2. Invoca skill `openspec-archive-change` con el nombre del change
3. Ejecuta `openspec sync` para mergear `specs/` delta a `openspec/specs/<capability>/spec.md`
4. Mueve `openspec/changes/<nombre>/` a `openspec/changes/archive/YYYY-MM-DD-<nombre>/`
5. Actualiza `openspec list` (change ya no aparece como activo)
6. Marca `[x]` en `CHANGES.md` para ese change

## Requisitos
- Todas las tasks completadas (`[x]`)
- Tests pasando
- Build exitoso (`npm run build`)

## Ejemplos
```
/opsx:archive C-01-foundation-infra
/opsx:archive C-04-leads-form
```