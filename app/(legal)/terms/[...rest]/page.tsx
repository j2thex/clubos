import { permanentRedirect } from "next/navigation";

export default function TermsCatchAll() {
  permanentRedirect("/terms");
}
