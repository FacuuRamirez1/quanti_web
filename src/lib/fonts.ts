/**
 * Poppins: tipografía de los diseños Figma de `/admin/login` y `/politicas`.
 * Instancia única de next/font compartida (scoped vía `poppins.className`).
 */
import { Poppins } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
