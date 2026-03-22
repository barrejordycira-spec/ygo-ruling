"use client";

import { useChat } from "@ai-sdk/react";
import { Chat } from "@/components/chat";

export default function Home() {
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  function handleSend(text: string) {
    sendMessage({ text });
  }

  return (
    <div className="flex flex-col h-dvh max-w-3xl mx-auto">
      <header className="flex-none border-b border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold">YGO Ruling Assistant</h1>
        <p className="text-sm text-gray-400">
          Décrivez votre situation de jeu pour obtenir un ruling
        </p>
      </header>

      <Chat
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
      />
    </div>
  );
}
