"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";

export default function useAuth() {
  const context = useAuthContext();

  const normalizedUser = useMemo(() => {
    if (!context.user) return null;

    return {
      ...context.user,
      id:
        context.user.id !== undefined && context.user.id !== null
          ? Number(context.user.id)
          : context.user.id,
    };
  }, [context.user]);

  return {
    ...context,
    user: normalizedUser,
    hydrated: context.hydrated,
  };
}