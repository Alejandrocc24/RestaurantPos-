import { config } from './index.js';

export const customCorsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Permitir solicitudes sin origen (ej. curl, postman, apps móviles nativas)
  if (!origin) return callback(null, true);

  // En entorno de desarrollo permitimos cualquier origen (o podriamos limitarlo a local)
  if (config.isDevelopment) {
    return callback(null, true);
  }

  // Permitir automáticamente todos los dominios generados por Vercel (útil para deploy previews)
  if (origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }

  // Validar con la variable de entorno FRONTEND_URL si existe
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    const allowed = frontendUrl.split(',').map(url => url.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
  } else {
    // Si no se configuró FRONTEND_URL en producción, por defecto permitimos 
    // para no bloquear la aplicación, pero en un entorno estricto debería ser false.
    return callback(null, true);
  }

  // Denegar si no coincide con ninguna de las reglas
  return callback(null, false);
};
