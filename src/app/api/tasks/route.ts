import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = 'force-dynamic';





export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        id: body.id,
        title: body.title,
        notes: body.notes,
        priority: body.priority,
        status: body.status || "active",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId: body.projectId,
        clientId: body.clientId,
        userId: session.user.id,
        order: body.order,
        createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
      },
    });
    return NextResponse.json(task);
  } catch {
    
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
