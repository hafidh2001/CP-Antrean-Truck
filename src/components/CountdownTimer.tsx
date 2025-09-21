import { memo } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  hours: number;
  minutes: number;
  seconds: number;
  className?: string;
  showWarning?: boolean;
}

export const CountdownTimer = memo(({ 
  hours, 
  minutes, 
  seconds, 
  className,
  showWarning = true 
}: CountdownTimerProps) => {
  // Determine color based on remaining time
  const totalMinutes = hours * 60 + minutes;
  const isUrgent = totalMinutes < 5; // Less than 5 minutes
  const isWarning = totalMinutes < 15; // Less than 15 minutes

  const getTimeColor = () => {
    if (isUrgent) return 'text-red-600 font-bold animate-pulse';
    if (isWarning && showWarning) return 'text-orange-500 font-semibold';
    return 'text-gray-700';
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return (
      <span className={cn(getTimeColor(), className)}>
        {hours} JAM {formatNumber(minutes)} MENIT {formatNumber(seconds)} DETIK
      </span>
    );
  }

  if (minutes > 0) {
    return (
      <span className={cn(getTimeColor(), className)}>
        {minutes} MENIT {formatNumber(seconds)} DETIK
      </span>
    );
  }

  return (
    <span className={cn(getTimeColor(), className)}>
      {seconds} DETIK
    </span>
  );
});

CountdownTimer.displayName = 'CountdownTimer';