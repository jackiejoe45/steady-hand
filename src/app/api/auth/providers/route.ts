import { getOAuthProviders } from "@/lib/auth-config";

export function GET() {
  return Response.json(getOAuthProviders());
}
