# Convención de migraciones — Quanti (C-01)

Fuente: `knowledge-base/04_modelo_de_datos.md` + decisión de diseño 7.

## Nombrado

```
supabase/migrations/YYYYMMDDHHMMSS_nombre_descriptivo.sql
```

- `YYYYMMDDHHMMSS`: timestamp UTC de creación (ej. `20260115120000_leads_init.sql`).
- Un archivo = un cambio atómico y reversible cuando aplique.
- Nunca editar una migración ya aplicada en un entorno compartido: crear una
  nueva migración que corrija.

## Contenido esperado (desde C-02)

1. `CREATE TABLE` + comentarios (`COMMENT ON`).
2. Índices necesarios (parciales donde aplique).
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies (cada policy con su
   test de verificación, ver `APLICAR.md`).
4. `GRANT` explícitos a `anon`/`authenticated` donde la Data API lo requiera.
5. Storage buckets + policies de Storage si aplica.

## Qué NO va en C-01

En este change no hay escrituras contra la DB (spec: migraciones-versionadas).
C-02 agrega la migración `001` siguiendo esta convención.
