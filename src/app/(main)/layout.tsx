import "@/app/globals.css";
import NavBar from "@/components/NavBar";
import { ReactNode, Suspense } from "react";
import { I18nProvider } from "@/contexts/I18nContext";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <I18nProvider>
        <div className="flex min-h-screen">
          <Suspense>
            <NavBar />
          </Suspense>
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
        </div>
      </I18nProvider>
    </Suspense>
  );
}
