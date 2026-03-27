import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = 'force-dynamic';


export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const body = await req.json();
    
    // Convert string dates to Date objects if they exist
    const dataToUpdate = { ...body };
    if (dataToUpdate.dueDate !== undefined) {
      dataToUpdate.dueDate = dataToUpdate.dueDate ? new Date(dataToUpdate.dueDate) : null;
    }
    if (dataToUpdate.completedAt !== undefined) {
      dataToUpdate.completedAt = dataToUpdate.completedAt ? new Date(dataToUpdate.completedAt) : null;
    }
    
    const result = await prisma.task.updateMany({
      where: { id, userId: session.user.id },
      data: dataToUpdate,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    
    const task = await prisma.task.findUnique({ where: { id } });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const result = await prisma.task.deleteMany({
      where: { id, userId: session.user.id },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
