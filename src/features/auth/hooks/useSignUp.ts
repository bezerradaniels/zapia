import { useMutation } from "@tanstack/react-query";
import { track } from "@/features/analytics";
import { signUp } from "../api/mutations";

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      track("sign_up", {
        method: "email",
        user_id: data.user?.id,
        plan_tier: "trial",
      });
    },
  });
}
