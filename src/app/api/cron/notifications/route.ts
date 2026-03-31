import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface TaskWithUser {
  id: string;
  title: string;
  user: {
    id: string;
    telegramChatId: string | null;
  } | null;
}

interface UserWithTasks {
  id: string;
  name: string | null;
  telegramChatId: string | null;
  dailyBriefingTime: string | null;
  tasks: {
    id: string;
    title: string;
    priority: string;
    dueDate: Date | null;
  }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isTest = searchParams.get('test') === 'true';

  const authHeader = req.headers.get('authorization');
  const session = await getServerSession(authOptions);

  if (!isTest) {
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  } else if (!session?.user?.id) {
    return NextResponse.json({ error: "Session requise" }, { status: 401 });
  }

  const now = new Date();
  const userId = isTest ? session?.user?.id : undefined;

  // 1. Process Overdue Tasks
  const overdueTasksRaw = await prisma.task.findMany({
    where: {
      status: "active",
      dueDate: { lt: now },
      ...(isTest ? {} : { notifiedOverdue: false }),
      user: userId ? { id: userId } : {
        notifyOverdue: true,
        telegramChatId: { not: null }
      }
    },
    include: { user: { select: { id: true, telegramChatId: true } } }
  });
  
  const overdueTasks = overdueTasksRaw as unknown as TaskWithUser[];

  for (const task of overdueTasks) {
    if (task.user?.telegramChatId) {
      try {
        await sendTelegramNotification(
          task.user.telegramChatId,
          `⚠️ <b>Tâche en retard !</b>\n\nLa tâche "<b>${task.title}</b>" a dépassé sa limite.`
        );
        if (!isTest) {
          await prisma.task.update({ where: { id: task.id }, data: { notifiedOverdue: true } });
        }
      } catch {
        // Ignored
      }
    }
  }

  // 2. Process Approaching Deadlines
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const approachingTasksRaw = await prisma.task.findMany({
    where: {
      status: "active",
      dueDate: { gt: now, lte: tomorrow },
      ...(isTest ? {} : { notifiedApproaching: false }),
      user: userId ? { id: userId } : {
        notifyApproachingDeadline: true,
        telegramChatId: { not: null }
      }
    },
    include: { user: { select: { id: true, telegramChatId: true } } }
  });

  const approachingTasks = approachingTasksRaw as unknown as TaskWithUser[];

  for (const task of approachingTasks) {
    if (task.user?.telegramChatId) {
      try {
        await sendTelegramNotification(
          task.user.telegramChatId,
          `⏳ <b>Expiration imminente</b>\n\nPlus que 24h pour : "<b>${task.title}</b>".`
        );
        if (!isTest) {
          await prisma.task.update({ where: { id: task.id }, data: { notifiedApproaching: true } });
        }
      } catch {
        // Ignored
      }
    }
  }

  // 3. Process Daily Briefing
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hour12: false
  });
  const currentParisHour = parseInt(formatter.format(now), 10);
  
  const usersForBriefingRaw = await prisma.user.findMany({
    where: (userId ? { id: userId } : {
      notifyDailyBriefing: true,
      telegramChatId: { not: null }
    }),
    include: {
      tasks: { 
        where: { status: "active" },
        select: { id: true, title: true, priority: true, dueDate: true }
      }
    }
  });

  const usersForBriefing = usersForBriefingRaw as unknown as UserWithTasks[];

  let briefingSentCount = 0;
  for (const user of usersForBriefing) {
    if (!user.telegramChatId) continue;

    const userBriefingHour = parseInt((user.dailyBriefingTime || "08:00").split(":")[0], 10);
    if (!isTest && userBriefingHour !== currentParisHour) continue;
    
    briefingSentCount++;
    const total = user.tasks.length;
    if (total === 0 && !isTest) continue;
    
    const msg = `☕ <b>FocusDesk: Briefing</b>\n\nBonjour ${user.name || ''} !\nVous avez <b>${total}</b> tâches en cours.\n`;
    try {
      await sendTelegramNotification(user.telegramChatId, msg);
    } catch {
      // Ignored
    }
  }

  return NextResponse.json({ 
    success: true, 
    processed: {
      overdueTasks: overdueTasks.length,
      approachingTasks: approachingTasks.length,
      briefingsSent: briefingSentCount
    }
  });
}
