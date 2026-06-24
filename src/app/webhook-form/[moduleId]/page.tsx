import { notFound } from "next/navigation";
import { loadModules } from "@/lib/config-loader";
import WebhookForm from "@/components/WebhookForm";

export async function generateStaticParams() {
  return loadModules().filter((m) => m.type === "webhook").map((mod) => ({
    moduleId: mod.id,
  }));
}

export default async function WebhookPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = loadModules().find((m) => m.id === moduleId);

  if (!mod || mod.type !== "webhook") {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <WebhookForm module={mod} />
    </div>
  );
}
