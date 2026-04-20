import { SubscriptionForm } from "@/components/subscription-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">SubCraft</h1>
        <p className="text-sm text-muted-foreground">
          无状态的代理订阅转换工具
        </p>
      </div>
      <SubscriptionForm />
    </main>
  );
}
