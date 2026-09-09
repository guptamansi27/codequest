export function cn(...inputs) {
  // Simple className merging function
  return inputs.filter(Boolean).join(' ');
}
