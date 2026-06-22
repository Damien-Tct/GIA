import { notFound } from "next/navigation";
import { getModuleById, getModulesByType } from "@/lib/config";
import ClientChatPage from "@/components/ClientChatPage";

export async function generateStaticParams() {
  return getModulesByType("chat").map((mod) => ({
    moduleId: mod.id,
  }));
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = getModuleById(moduleId);

  if (!mod || mod.type !== "chat") {
    notFound();
  }

  return <ClientChatPage module={mod} />;
}
