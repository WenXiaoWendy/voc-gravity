import { useCallback, useRef, useState } from 'react';

/**
 * 带自动消失功能的错误提示 hook
 * @param duration 自动消失延迟，默认 3500ms
 */
export function useErrorMessage(duration = 3500) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setErrorMessage(msg);
    timerRef.current = setTimeout(() => setErrorMessage(null), duration);
  }, [duration]);

  const clearError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setErrorMessage(null);
  }, []);

  return { errorMessage, showError, clearError };
}
