"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, LogOut } from "lucide-react";
import { createTodo, toggleTodo, deleteTodo, getTodos } from "@/modules/todo/server-actions";
import type { Todo } from "@/lib/db/schema";

interface TodoPageProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  initialTodos: Todo[];
}

export function TodoPage({ user, initialTodos }: TodoPageProps) {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refreshTodos() {
    const loaded = await getTodos();
    setTodos(loaded);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const title = newTitle.trim();
    setNewTitle("");

    startTransition(async () => {
      await createTodo(title);
      await refreshTodos();
    });
  }

  async function handleToggle(id: string, completed: boolean) {
    startTransition(async () => {
      await toggleTodo(id, completed);
      await refreshTodos();
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTodo(id);
      await refreshTodos();
    });
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{user.name ?? user.email} 的待办</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={handleSignOut}>
              <LogOut className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                placeholder="添加新任务..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Button type="submit" disabled={isPending}>
                添加
              </Button>
            </form>

            <div className="space-y-2">
              {todos.length === 0 ? (
                <p className="text-center text-sm text-muted">暂无任务</p>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={(checked) =>
                        handleToggle(todo.id, checked === true)
                      }
                    />
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed ? "text-muted line-through" : "text-text"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(todo.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
