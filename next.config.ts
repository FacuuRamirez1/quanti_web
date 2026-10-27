import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace (evita que Next infiera C:\Users\facun por un
  // lockfile ajeno al repo). Hosts de imágenes Supabase Storage: C-02/C-06 (R6).
  outputFileTracingRoot: __dirname,
  // Requerido por `forbidden()` (Next 15): el 403 de `requireRole()` (C-03)
  // ante sesión sin rol suficiente solo funciona con este flag.
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
