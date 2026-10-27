# /opsx:update

Actualiza un change existente: revisa proposal, design, tasks, specs y los mantiene coherentes.

## Uso
```
/opsx:update <nombre-change> [--artifact <proposal|design|tasks|specs>]
```

## Qué hace
1. Invoca skill `openspec-update-change` con el nombre del change
2. Si se especifica `--artifact`, actualiza solo ese artifact
3. Si no, revisa coherencia entre todos (proposal ↔ design ↔ tasks ↔ specs)
4. Útil cuando:
   - Cambió el alcance tras descubrimiento técnico
   - Nueva decisión de arquitectura afecta design
   - Tasks necesitan re-ordenarse o dividirse

## Ejemplos
```
/opsx:update C-04-leads-form
/opsx:update C-04-leads-form --artifact tasks
/opsx:update C-07-checkout-payment --artifact design
```