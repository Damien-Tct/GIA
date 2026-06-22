"use client";

import dynamic from "next/dynamic";
import { N8nModule } from "@/lib/types";

const N8nChat = dynamic(() => import("@/components/N8nChat"), {
  ssr: false,
});

export default function ClientChatPage({ module }: { module: N8nModule }) {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <N8nChat module={module} />
    </div>
  );
}
