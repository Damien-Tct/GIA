import { notFound } from "next/navigation";
import { loadModules } from "@/lib/config-loader";
import ClientChatPage from "@/components/ClientChatPage";

export async function generateStaticParams() {
  return loadModules().filter((m) => m.type === "chat").map((mod) => ({
    moduleId: mod.id,
  }));
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = loadModules().find((m) => m.id === moduleId);

  if (!mod || mod.type !== "chat") {
    notFound();
  }

  return <ClientChatPage module={mod} />;
}
