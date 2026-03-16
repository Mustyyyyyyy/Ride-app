"use client";

import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white px-4 py-10 text-gray-900">
          <div className="mx-auto flex min-h-[85vh] max-w-xl items-center justify-center">
            Loading...
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}