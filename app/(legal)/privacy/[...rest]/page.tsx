import { permanentRedirect } from "next/navigation";

export default function PrivacyCatchAll() {
  permanentRedirect("/privacy");
}
