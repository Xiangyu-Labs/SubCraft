import { SubscriptionForm } from './components/SubscriptionForm';
import { Toaster } from './components/Toaster';

export function App() {
  return (
    <>
      <Toaster />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <header>
          <h1 className="text-base font-bold">subcraft</h1>
        </header>
        <SubscriptionForm />
        <footer className="border-t border-line pt-3 text-xs text-muted">
          <a href="https://github.com/Xiangyu-Labs/SubCraft" className="hover:text-fg">
            github.com/Xiangyu-Labs/SubCraft
          </a>
        </footer>
      </main>
    </>
  );
}
