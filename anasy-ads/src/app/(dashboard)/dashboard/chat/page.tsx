import { auth } from "@clerk/nextjs/server";
import { ChatInterface } from "@/components/chat/chat-interface";

export const metadata = {
  title: "Chat AI · Anasy Ads",
};

export default async function ChatPage() {
  await auth();

  return (
    <div className="flex h-full flex-col -m-6">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Chat AI</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Converse com o Anasy AI sobre suas campanhas e contas de anúncios.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}
