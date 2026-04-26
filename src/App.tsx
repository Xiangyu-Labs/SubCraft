import { SubscriptionForm } from './components/SubscriptionForm';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Toaster } from './components/Toaster';

export function App() {
  return (
    <>
      <Toaster />
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">SubCraft</h1>
          <p className="text-sm text-muted-foreground">
            无状态的代理订阅转换工具
          </p>
        </div>
        <SubscriptionForm />
      </main>
      <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <ThemeSwitcher />
      </div>
    </>
  );
}
