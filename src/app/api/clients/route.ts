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

    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        id: body.id,
        name: body.name,
        archived: body.archived || false,
        userId: session.user.id,
        createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
      },
    });
    return NextResponse.json(client);
  } catch (error: unknown) {
    console.error("CLIENT CREATION ERROR:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
