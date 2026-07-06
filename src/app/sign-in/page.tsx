import { AuthButtonsWrapper } from "@/components/AuthButtonsWrapper";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SignInPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pb-4">
      <PageHeader
        index="03 / Account"
        title="SteadyHand"
        subtitle="Sign in to submit your daily attempt"
        compact
      />
      <AuthButtonsWrapper />
    </div>
  );
}
