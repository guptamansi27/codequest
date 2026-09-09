import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "codequest:dismissed-activities";

const readDismissedIds = (storageKey) => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeDismissedIds = (storageKey, ids) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify([...ids]));
};

export function useDismissedActivities(scope, owner = "") {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${scope}:${String(owner || "anonymous").toLowerCase()}`,
    [scope, owner]
  );
  const [dismissedIds, setDismissedIds] = useState(() => new Set(readDismissedIds(storageKey)));

  useEffect(() => {
    setDismissedIds(new Set(readDismissedIds(storageKey)));
  }, [storageKey]);

  const dismissActivities = useCallback(
    (activityIds) => {
      setDismissedIds((current) => {
        const next = new Set(current);
        activityIds.forEach((activityId) => next.add(String(activityId)));
        writeDismissedIds(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  return { dismissedIds, dismissActivities };
}
