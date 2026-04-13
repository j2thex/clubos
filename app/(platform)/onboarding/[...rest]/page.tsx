import { permanentRedirect } from "next/navigation";

export default function OnboardingCatchAll() {
  permanentRedirect("/onboarding");
}
