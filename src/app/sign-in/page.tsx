import { AuthButtonsWrapper } from "@/components/AuthButtonsWrapper";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Steady<span className="text-[#4FC3F7]">Hand</span>
        </h1>
        <p className="text-zinc-500 mt-2">
          Sign in to submit your daily attempt
        </p>
      </div>
      <AuthButtonsWrapper />
    </div>
  );
}
