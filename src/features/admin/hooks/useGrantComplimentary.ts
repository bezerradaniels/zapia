import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { grantComplimentary } from "../api/mutations";
import type { CustomPlanLimits, PlanId } from "@/types/domain";

export function useGrantComplimentary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      planId,
      expiresAt,
      notes,
      customLimits,
    }: {
      storeId: string;
      planId: PlanId;
      expiresAt: string;
      notes?: string;
      customLimits?: CustomPlanLimits | null;
    }) => grantComplimentary(storeId, planId, expiresAt, notes, customLimits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      toast.success("Gratuidade concedida com sucesso.");
    },
    onError: (err) => {
      toast.error("Erro ao conceder gratuidade", {
        description: (err as Error).message,
      });
    },
  });
}
