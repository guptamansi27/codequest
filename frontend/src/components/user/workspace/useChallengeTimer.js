import { useCallback, useEffect, useRef, useState } from "react";
import challengeTimerService, { formatTimer } from "../../../services/challengeTimerService";

const SYNC_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 1000;

export default function useChallengeTimer(challengeId) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const accumulatedSecondsRef = useRef(0);
  const activeStartedAtRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const syncingRef = useRef(false);
  const completedRef = useRef(false);

  const calculateElapsedSeconds = useCallback(() => {
    if (!activeStartedAtRef.current || completedRef.current) {
      return accumulatedSecondsRef.current;
    }
    return accumulatedSecondsRef.current + Math.floor((Date.now() - activeStartedAtRef.current) / 1000);
  }, []);

  const stopIntervals = useCallback(() => {
    if (tickIntervalRef.current) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  const applyServerState = useCallback((result, { close = false } = {}) => {
    const completed = Boolean(result?.is_completed);
    const totalSeconds = Math.max(Math.floor(Number(result?.total_time_seconds) || 0), 0);

    accumulatedSecondsRef.current = totalSeconds;
    completedRef.current = completed;
    activeStartedAtRef.current = completed || close ? null : Date.now();
    setElapsedSeconds(totalSeconds);
    setIsCompleted(completed);

    if (completed) {
      stopIntervals();
    }
  }, [stopIntervals]);

  const sync = useCallback(async (action = "sync", serverSnapshot = null) => {
    if (!challengeId) return null;
    if (action === "complete") {
      applyServerState({ ...(serverSnapshot || {}), is_completed: true }, { close: true });
      return serverSnapshot;
    }
    if (syncingRef.current) return null;
    if (completedRef.current) return null;

    syncingRef.current = true;
    try {
      const result = action === "close"
        ? await challengeTimerService.close(challengeId)
        : await challengeTimerService.sync(challengeId);
      applyServerState(result, { close: action === "close" });
      return result;
    } finally {
      syncingRef.current = false;
    }
  }, [applyServerState, challengeId]);

  useEffect(() => {
    if (!challengeId) return undefined;
    let mounted = true;

    accumulatedSecondsRef.current = 0;
    activeStartedAtRef.current = Date.now();
    completedRef.current = false;
    setElapsedSeconds(0);
    setIsCompleted(false);

    challengeTimerService.open(challengeId)
      .then((result) => {
        if (!mounted) return;
        applyServerState(result);
      })
      .catch(() => {});

    tickIntervalRef.current = window.setInterval(() => {
      if (!mounted || completedRef.current) return;
      setElapsedSeconds(calculateElapsedSeconds());
    }, TICK_INTERVAL_MS);

    syncIntervalRef.current = window.setInterval(() => {
      sync("sync").catch(() => {});
    }, SYNC_INTERVAL_MS);

    return () => {
      mounted = false;
      stopIntervals();
      const finalSeconds = calculateElapsedSeconds();
      accumulatedSecondsRef.current = finalSeconds;
      activeStartedAtRef.current = null;
      setElapsedSeconds(finalSeconds);
      challengeTimerService.close(challengeId).catch(() => {});
    };
  }, [applyServerState, calculateElapsedSeconds, challengeId, stopIntervals, sync]);

  return {
    elapsedSeconds,
    formattedTime: formatTimer(elapsedSeconds),
    isCompleted,
    syncTimer: sync,
  };
}
