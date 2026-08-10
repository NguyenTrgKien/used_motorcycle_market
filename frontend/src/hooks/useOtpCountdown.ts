import { useCallback, useEffect, useState } from "react";

interface UseOtpCountdownProps {
  duration?: number;
  storageKey?: string;
}

export default function useOtpCountdown({
  duration = 60,
  storageKey = "otpCountdown",
}: UseOtpCountdownProps = {}) {
  const getRemainingTime = useCallback(() => {
    const savedTime = localStorage.getItem(storageKey);
    if (!savedTime) return 0;
    const elapsed = Math.floor((Date.now() - Number(savedTime)) / 1000);

    return Math.max(0, duration - elapsed);
  }, [duration, storageKey]);

  const [countdown, setCountdown] = useState(getRemainingTime());
  const canResend = countdown === 0;

  const startCountdown = (cooldownEndsAt?: string | number | Date) => {
    const endTime = cooldownEndsAt
      ? new Date(cooldownEndsAt).getTime()
      : Date.now() + duration * 1000;
    const startedAt = endTime - duration * 1000;
    localStorage.setItem(storageKey, startedAt.toString());
    setCountdown(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
  };

  const resetCountdown = () => {
    localStorage.removeItem(storageKey);
    setCountdown(0);
  };

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(getRemainingTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, getRemainingTime]);

  return {
    countdown,
    canResend,
    startCountdown,
    resetCountdown,
  };
}
