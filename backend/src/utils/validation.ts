/**
 * Valida que el email sea válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que la contraseña cumpla requisitos mínimos
 */
export function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Valida que el nombre no esté vacío
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

/**
 * Valida que un número sea válido
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(value) && value >= 0;
}

/**
 * Sanitiza un string eliminando caracteres peligrosos
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}
