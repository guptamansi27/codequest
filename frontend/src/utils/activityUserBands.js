/**
 * Stable light "band" index per distinct user name (for activity list styling).
 */
export function buildActivityUserBandMap(activities) {
  const map = new Map();
  let next = 0;
  for (const row of activities || []) {
    const key = row?.user != null ? String(row.user) : "";
    if (!map.has(key)) {
      map.set(key, next % 4);
      next += 1;
    }
  }
  return map;
}
