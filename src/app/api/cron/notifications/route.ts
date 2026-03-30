import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  // Validate request is legitimately coming from Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  // ---------------------------------------------------------
  // 1. Process Overdue Tasks
  // ---------------------------------------------------------
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: "active",
      dueDate: { lt: now },
      notifiedOverdue: false,
      user: {
        notifyOverdue: true,
        telegramChatId: { not: null }
      }
    },
    include: { user: true }
  });

  for (const task of overdueTasks) {
    if (task.user.telegramChatId) {
      try {
        await sendTelegramNotification(
          task.user.telegramChatId,
          `⚠️ <b>Tâche en retard !</b>\n\nLa tâche officielle "<b>${task.title}</b>" vient de dépasser sa date limite.`
        );
        await prisma.task.update({ where: { id: task.id }, data: { notifiedOverdue: true } });
      } catch (e) {
        console.error("Cron Overdue Email Error:", e);
      }
    }
  }

  // ---------------------------------------------------------
  // 2. Process Approaching Deadlines (due in < 24h)
  // ---------------------------------------------------------
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const approachingTasks = await prisma.task.findMany({
    where: {
      status: "active",
      dueDate: { gt: now, lte: tomorrow },
      notifiedApproaching: false,
      user: {
        notifyApproachingDeadline: true,
        telegramChatId: { not: null }
      }
    },
    include: { user: true }
  });

  for (const task of approachingTasks) {
    if (task.user.telegramChatId) {
      try {
        await sendTelegramNotification(
          task.user.telegramChatId,
          `⏳ <b>Expiration imminente</b>\n\nAttention ! Plus que 24h pour terminer : "<b>${task.title}</b>".`
        );
        await prisma.task.update({ where: { id: task.id }, data: { notifiedApproaching: true } });
      } catch (e) {
        console.error("Cron Approaching Deadline Error:", e);
      }
    }
  }

  // ---------------------------------------------------------
  // 3. Process Daily Briefing (User's custom Paris Time)
  // ---------------------------------------------------------
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hour12: false
  });
  const currentParisHour = parseInt(formatter.format(now), 10);
  
  const usersForBriefing = await prisma.user.findMany({
    where: {
      notifyDailyBriefing: true,
      telegramChatId: { not: null }
    },
    include: {
      tasks: {
        where: { status: "active" }
      }
    }
  });

  let briefingSentCount = 0;
  for (const user of usersForBriefing) {
    if (!user.telegramChatId) continue;
    
    // Check if the current Paris hour matches the hour setting in user.dailyBriefingTime
    // Format is "08:00", so we extract the first 2 characters
    const userBriefingHour = parseInt((user.dailyBriefingTime || "08:00").split(":")[0], 10);
    
    if (userBriefingHour !== currentParisHour) {
      continue;
    }
    
    briefingSentCount++;
      
      const total = user.tasks.length;
      if (total === 0) continue; 
      
      const urgent = user.tasks.filter(t => t.priority === "high" || (t.dueDate && new Date(t.dueDate).getTime() < now.getTime() + 24 * 60 * 60 * 1000));
      
      let msg = `☕ <b>FocusDesk: Morning Briefing</b>\n\nBonjour ${user.name || ''} ! Voici votre planning.\nVous avez <b>${total}</b> tâches en cours au total.\n`;
      if (urgent.length > 0) {
         msg += `\n🔥 ${urgent.length} nécessitent votre attention en prio :\n`;
         urgent.slice(0, 3).forEach(t => msg += `- ${t.title}\n`);
         if (urgent.length > 3) msg += `- <i>...et ${urgent.length - 3} autres.</i>\n`;
      } else {
         msg += `\nAucune urgence aujourd'hui, détendez-vous ! 🧘‍♂️`;
      }
      
      try {
        await sendTelegramNotification(user.telegramChatId, msg);
      } catch (e) {
        console.error("Cron Briefing Error:", e);
      }
    }
  }

  // 4. End of execution reporting
  return NextResponse.json({ 
    success: true, 
    processed: {
      overdueTasks: overdueTasks.length,
      approachingTasks: approachingTasks.length,
      briefingsSent: briefingSentCount
    }
  });
}
