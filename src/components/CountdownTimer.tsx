"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
export default function CountdownTimer({ dueDate, isUrgent = true }: { dueDate: string | Date, isUrgent?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ digits: string, letters: string, isLate: boolean } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(dueDate).getTime() - new Date().getTime();
      const isLate = difference <= 0;
      const absoluteDiff = Math.abs(difference);
      
      const days = Math.floor(absoluteDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absoluteDiff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((absoluteDiff / 1000 / 60) % 60);
      const seconds = Math.floor((absoluteDiff / 1000) % 60);
      
      let digits = "";
      if (days > 0) digits += `${days}j `;
      digits += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      let text = "";
      if (days > 0) {
        text = `environ ${days} jour${days > 1 ? 's' : ''}`;
      } else if (hours === 0) {
        text = `moins d'une heure`;
      } else {
        text = `moins de ${hours + 1} heures`;
      }
      
      let letters = isLate ? `En retard (${text})` : `Dans ${text}`;

      if (isLate) {
        digits = `RETARD ${digits}`;
      }

      return { digits, letters, isLate };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [dueDate]);

  if (!timeLeft) return <span className="opacity-0">...</span>;

  return (
    <div className="flex flex-col mt-0.5 gap-0.5">
      <span className={clsx(
        "text-[10px] font-bold tracking-widest uppercase transition-colors",
        timeLeft.isLate ? "text-danger" : "text-zinc-500/80"
      )}>
        {timeLeft.letters}
      </span>
      {isUrgent && (
        <span className={clsx(
          "font-mono font-bold tracking-widest text-[10px] uppercase transition-colors",
          timeLeft.isLate ? "text-danger" : "text-primary dark:text-primary-dim opacity-90"
        )}>
          {timeLeft.digits}
        </span>
      )}
    </div>
  );
}
