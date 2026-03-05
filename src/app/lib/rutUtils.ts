/**
 * Utilidades para el manejo del RUT chileno.
 * Formato: xxx.xxx.xxx-x (cuerpo con puntos y dígito verificador con guión)
 */

/**
 * Formatea un RUT chileno mientras el usuario escribe.
 * Acepta cualquier entrada y la normaliza al formato xxx.xxx.xxx-x
 */
export function formatRut(value: string): string {
  // Elimina todo excepto dígitos y la letra K
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();

  if (clean.length === 0) return '';

  // Separa cuerpo y dígito verificador
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  if (body.length === 0) return dv;

  // Agrega puntos cada 3 dígitos (de derecha a izquierda)
  const formatted = body
    .split('')
    .reverse()
    .reduce((acc: string[], digit, idx) => {
      if (idx > 0 && idx % 3 === 0) acc.push('.');
      acc.push(digit);
      return acc;
    }, [])
    .reverse()
    .join('');

  return `${formatted}-${dv}`;
}

/**
 * Devuelve true si el RUT chileno es matemáticamente válido.
 */
export function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);

  return dv === expectedDv;
}
