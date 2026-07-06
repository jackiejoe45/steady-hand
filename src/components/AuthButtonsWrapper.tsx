import { getOAuthProviders } from "@/lib/auth-config";
import { AuthButtons } from "./AuthButtons";

export function AuthButtonsWrapper() {
  const { google, apple } = getOAuthProviders();
  return <AuthButtons googleEnabled={google} appleEnabled={apple} />;
}
