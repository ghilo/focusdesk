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
    const result = await prisma.project.updateMany({
      where: { id, userId: session.user.id },
      data: body,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    
    const project = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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
    const result = await prisma.project.deleteMany({
      where: { id, userId: session.user.id },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
