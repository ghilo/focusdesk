import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, Project, Client } from "@/types";
import { Check, GripVertical, Calendar, AlertCircle, Clock } from "lucide-react";
import clsx from "clsx";
import { isBefore, startOfToday, isToday, isTomorrow } from "date-fns";
import { useEffect, useState } from "react";

interface TaskCardProps {
  task: Task;
  project?: Project;
  client?: Client;
  onComplete: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onClick: () => void;
}

export default function TaskCard({ task, project, client, onComplete, onUncomplete, onClick }: TaskCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (task.status === "done" || !task.dueDate) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [task.dueDate, task.status]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfToday());
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));
  
  const isDone = task.status === "done";
  
  const isDanger = (isOverdue || isDueToday) && !isDone;
  const isWarning = isDueTomorrow && !isDone;

  let countdownText = null;
  if (task.dueDate && !isDone) {
    const diff = new Date(task.dueDate).getTime() - now.getTime();
    if (diff < 0) {
      countdownText = "En retard";
    } else {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (d > 0) countdownText = `${d}j ${h}h`;
      else if (h > 0) countdownText = `${h}h ${m}m`;
      else countdownText = `${m}m ${s}s`;
    }
  }

  return (
    <div
      ref={isDone ? undefined : setNodeRef}
      style={isDone ? undefined : style}
      onClick={onClick}
      className={clsx(
        "group flex items-stretch gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300",
        isDragging 
          ? "opacity-60 ring-1 ring-primary/50 relative z-50 shadow-[0_16px_40px_rgba(186,158,255,0.15)] bg-surface-highest scale-[1.02]"
          : isDone 
            ? "opacity-60 bg-surface-container/30 hover:bg-surface-container/50"
            : isDanger
              ? "bg-danger/10 hover:bg-danger/20"
              : isWarning
                ? "bg-orange-500/10 hover:bg-orange-500/20"
                : "bg-surface-container hover:bg-surface-highest hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      )}
    >
      {!isDone ? (
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-center justify-center -ml-2 text-zinc-600 outline-none cursor-grab active:cursor-grabbing hover:text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="w-5 h-5 -ml-2 flex-shrink-0" />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isDone && onUncomplete) {
            onUncomplete(task.id);
          } else {
            onComplete(task.id);
          }
        }}
        className={clsx(
          "mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 focus:outline-none",
          isDone 
            ? "border-primary bg-primary text-white shadow-[0_0_12px_rgba(186,158,255,0.4)]" 
            : "border-zinc-700 bg-surface text-transparent hover:border-primary hover:text-primary"
        )}
      >
        <Check className="w-4 h-4" />
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className={clsx(
            "font-medium truncate text-base transition-colors",
            isDone ? "text-zinc-500 line-through decoration-zinc-600" : "text-white"
          )}>
            {task.title}
          </p>
          {task.priority === "high" && !isDone && (
            <span className="flex-shrink-0 px-2 py-0.5 flex items-center rounded-md bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider">
              Urgent
            </span>
          )}
        </div>
        
        {(project || client || task.dueDate) && (
          <div className={clsx(
            "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs",
            isDone ? "text-zinc-600" : "text-zinc-400"
          )}>
            {project && (
              <span className="flex items-center gap-1.5 min-w-0">
                <span className={clsx(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  isDone ? "bg-zinc-600" : "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                )}></span>
                <span className="truncate max-w-[120px] font-medium">{project.name}</span>
              </span>
            )}
            {client && (
              <span className="flex items-center gap-1 min-w-0 font-medium">
                @<span className="truncate max-w-[100px]">{client.name}</span>
              </span>
            )}
            {task.dueDate && (
              <span className={clsx(
                "flex items-center gap-1.5 min-w-0",
                isDanger ? "text-danger font-medium" : isWarning ? "text-orange-500 font-medium" : ""
              )}>
                {isDanger ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {new Date(task.dueDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " à")}
              </span>
            )}
          </div>
        )}
      </div>

      {countdownText && (
        <div className={clsx(
          "flex-shrink-0 flex items-center justify-center ml-2 md:ml-4",
          isDanger ? "text-danger" : isWarning ? "text-orange-500" : "text-zinc-500"
        )}>
          <div className={clsx(
            "flex items-center gap-1.5 font-bold tracking-tight px-2.5 py-1.5 rounded-lg",
            isDanger ? "bg-danger/20" : isWarning ? "bg-orange-500/20" : "bg-surface-highest"
          )}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">{countdownText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
