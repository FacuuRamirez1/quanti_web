# /opsx:status

Muestra el estado actual de un change o lista todos los changes activos.

## Uso
```
/opsx:status [nombre-change]
```

## Qué hace
- Sin argumentos: `openspec list --json` → tabla de changes activos
- Con nombre: `openspec status --change "<nombre>" --json` → estado detallado

## Output típico (con nombre)
```
Change: C-04-leads-form
Schema: lead-capture
Status: IN_PROGRESS
Artifacts:
  ✅ proposal.md
  ✅ design.md
  ✅ tasks.md (3/5 done)
  ✅ specs/lead-form.spec.md
Apply requires: proposal, design, tasks
Next task: 1.3 - Server Action createLead
```

## Ejemplos
```
/opsx:status
/opsx:status C-04-leads-form
```