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
    const dataToUpdate = { ...body };
    const result = await prisma.client.updateMany({
      where: { id, userId: session.user.id },
      data: dataToUpdate,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    
    const client = await prisma.client.findUnique({ where: { id } });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
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
    
    // Delete associated tasks and projects to cascade
    await prisma.task.deleteMany({
      where: { clientId: id, userId: session.user.id },
    });
    
    await prisma.project.deleteMany({
      where: { clientId: id, userId: session.user.id },
    });

    const result = await prisma.client.deleteMany({
      where: { id, userId: session.user.id },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
