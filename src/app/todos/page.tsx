import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTodos } from "@/modules/todo/server-actions";
import { TodoPage } from "@/modules/todo/ui/todo-page";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const todos = await getTodos();

  return <TodoPage user={session.user} initialTodos={todos} />;
}
