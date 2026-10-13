import { useState, useEffect, useRef } from 'react';

export function useCountdown({
  endsAt = 0,
  duration = 15,
  clockOffset = 0,
  bonusTime = 0,
  onTick = null,
  onExpire = null
}) {
  const [remainingMs, setRemainingMs] = useState(0);
  const prevSecRef = useRef(null);
  const onExpireCalledRef = useRef(false);

  useEffect(() => {
    if (!endsAt) {
      setRemainingMs(0);
      return;
    }

    onExpireCalledRef.current = false;
    const totalDurationMs = (duration + bonusTime) * 1000;
    const adjustedEndsAt = endsAt + (bonusTime * 1000);

    const updateTimer = () => {
      const nowSynced = Date.now() + clockOffset;
      const diff = Math.max(0, adjustedEndsAt - nowSynced);
      setRemainingMs(diff);

      const currentSec = Math.ceil(diff / 1000);
      if (prevSecRef.current !== null && prevSecRef.current !== currentSec && currentSec > 0 && currentSec <= 5) {
        if (onTick) onTick(currentSec);
      }
      prevSecRef.current = currentSec;

      if (diff <= 0 && !onExpireCalledRef.current) {
        onExpireCalledRef.current = true;
        if (onExpire) onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 50); // High frequency for smooth progress bars

    return () => clearInterval(interval);
  }, [endsAt, duration, bonusTime, clockOffset, onTick, onExpire]);

  const totalDurationMs = (duration + bonusTime) * 1000;
  const progressPercent = totalDurationMs > 0 ? Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100)) : 0;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

  return {
    remainingMs,
    remainingSeconds,
    progressPercent,
    isExpired: remainingMs <= 0
  };
}
