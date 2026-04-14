"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function getTodos() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.query.todos.findMany({
    where: eq(todos.userId, session.user.id),
    orderBy: (todos, { desc }) => [desc(todos.createdAt)],
  });
}

export async function createTodo(title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.insert(todos).values({
    userId: session.user.id,
    title,
    completed: false,
  });

  revalidatePath("/todos");
}

export async function toggleTodo(id: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(todos)
    .set({ completed })
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)));

  revalidatePath("/todos");
}

export async function deleteTodo(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)));

  revalidatePath("/todos");
}
