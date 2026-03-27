import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: number | string;
  highlight?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

export default function StatCard({ title, value, highlight, onClick, isActive }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "p-6 rounded-2xl transition-all duration-300",
        highlight ? "bg-primary/10" : "bg-surface-container",
        onClick && "cursor-pointer hover:bg-surface-highest hover:-translate-y-1 shadow-[0_8px_16px_rgba(0,0,0,0.2)]",
        isActive && "bg-surface-highest shadow-[0_4px_32px_rgba(186,158,255,0.1)] ring-1 ring-primary/30"
      )}
    >
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{title}</h3>
      <p className={clsx(
        "font-display text-4xl font-extrabold tracking-tight",
        highlight ? "text-primary bg-clip-text text-transparent bg-gradient-to-br from-primary-dim to-primary" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}
