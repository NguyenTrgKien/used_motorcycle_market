import { useEffect, useState } from "react";

interface UseOtpCountdownProps {
  duration?: number;
  storageKey?: string;
}

export default function useOtpCountdown({
  duration = 60,
  storageKey = "otpCountdown",
}: UseOtpCountdownProps = {}) {
  const getRemainingTime = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (!savedTime) return 0;
    // eslint-disable-next-line react-hooks/purity
    const elapsed = Math.floor((Date.now() - Number(savedTime)) / 1000);

    return Math.max(0, duration - elapsed);
  };

  const [countdown, setCountdown] = useState(getRemainingTime());
  const canResend = countdown === 0;

  const startCountdown = () => {
    localStorage.setItem(storageKey, Date.now().toString());
    setCountdown(duration);
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
