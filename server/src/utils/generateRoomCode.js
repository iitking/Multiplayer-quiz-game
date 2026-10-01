/**
 * Generates a unique 4-character uppercase alphanumeric room code.
 * Excludes ambiguous characters like 0, O, 1, I for easy reading and typing.
 */
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRoomCode(existingCodes = new Set()) {
  let code = '';
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * CHARS.length);
      code += CHARS[randomIndex];
    }
    attempts++;
  } while (existingCodes.has && existingCodes.has(code) && attempts < 100);

  return code;
}

export function isValidRoomCode(code) {
  if (typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  return clean.length === 4;
}
