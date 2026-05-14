"use client";

import type { ChatMessage as ChatMessageType } from "@/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-sky-600 text-white"
            : "bg-white border border-slate-200 text-slate-800 shadow-sm"
        }`}
      >
        <p className="text-sm font-medium opacity-80 mb-1">
          {isUser ? "You" : "Assistant"}
        </p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
