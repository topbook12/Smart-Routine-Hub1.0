"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MutationOptions {
  method: "POST" | "PUT" | "DELETE";
  url: string;
  body?: unknown;
  successMsg?: string;
  errorMsg?: string;
  invalidateKeys?: unknown[][];
}

export function useAdminMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ method, url, body }: MutationOptions) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate the relevant queries
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["notices"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      variables.invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      if (variables.successMsg) toast.success(variables.successMsg);
    },
    onError: (err: Error, variables) => {
      toast.error(variables.errorMsg || err.message || "Operation failed");
    },
  });
}
