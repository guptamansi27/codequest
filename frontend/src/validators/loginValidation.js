export function validateEmail(value) {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateTcsEmail(value) {
  return validateEmail(value);
}

export function validateLoginPassword(value) {
  return String(value || "").trim().length > 0;
}
