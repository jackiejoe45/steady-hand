import { Suspense } from "react";
import { GameScreen } from "@/components/game/GameScreen";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="section-label animate-pulse-glow">Loading</p>
        </div>
      }
    >
      <GameScreen />
    </Suspense>
  );
}
