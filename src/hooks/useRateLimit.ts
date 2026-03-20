import { useState, useCallback } from "react";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  storageKey: string;
}

interface RateLimitState {
  isLimited: boolean;
  remainingTime: number;
  attemptsRemaining: number;
}

export const useRateLimit = ({ maxAttempts, windowMs, storageKey }: RateLimitConfig) => {
  const getStoredAttempts = useCallback((): number[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const attempts = JSON.parse(stored) as number[];
      const now = Date.now();
      // Filter out attempts outside the window
      return attempts.filter((timestamp) => now - timestamp < windowMs);
    } catch {
      return [];
    }
  }, [storageKey, windowMs]);

  const [state, setState] = useState<RateLimitState>(() => {
    const attempts = getStoredAttempts();
    const isLimited = attempts.length >= maxAttempts;
    const oldestAttempt = attempts[0] || 0;
    const remainingTime = isLimited ? Math.max(0, windowMs - (Date.now() - oldestAttempt)) : 0;
    return {
      isLimited,
      remainingTime,
      attemptsRemaining: Math.max(0, maxAttempts - attempts.length),
    };
  });

  const checkLimit = useCallback((): boolean => {
    const attempts = getStoredAttempts();
    const isLimited = attempts.length >= maxAttempts;
    
    if (isLimited) {
      const oldestAttempt = attempts[0] || 0;
      const remainingTime = Math.max(0, windowMs - (Date.now() - oldestAttempt));
      setState({
        isLimited: true,
        remainingTime,
        attemptsRemaining: 0,
      });
      return false;
    }
    
    return true;
  }, [getStoredAttempts, maxAttempts, windowMs]);

  const recordAttempt = useCallback(() => {
    const attempts = getStoredAttempts();
    const now = Date.now();
    const updatedAttempts = [...attempts, now];
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedAttempts));
    } catch {
      // Storage full or unavailable
    }
    
    const isLimited = updatedAttempts.length >= maxAttempts;
    setState({
      isLimited,
      remainingTime: isLimited ? windowMs : 0,
      attemptsRemaining: Math.max(0, maxAttempts - updatedAttempts.length),
    });
  }, [getStoredAttempts, maxAttempts, storageKey, windowMs]);

  const formatRemainingTime = useCallback((ms: number): string => {
    const minutes = Math.ceil(ms / 60000);
    if (minutes > 1) return `${minutes} minutes`;
    const seconds = Math.ceil(ms / 1000);
    return `${seconds} seconds`;
  }, []);

  return {
    ...state,
    checkLimit,
    recordAttempt,
    formatRemainingTime,
  };
};
