import { createAuthClient } from "better-auth/react";
import { sentinelClient } from "@better-auth/infra/client";
import { getAuthClientBaseURL } from "@/lib/auth-config";

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  plugins: [
    sentinelClient({
      autoSolveChallenge: true,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
