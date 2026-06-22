"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type {
  ChatMessage as ChatMessageType,
  UseCaseOutput,
  StructuredFormState,
} from "@/types";
import { EMPTY_STRUCTURED_FORM, isStructuredFormComplete } from "@/types";
import { ChatMessage } from "@/components/ChatMessage";
import { ReviewForm } from "@/components/ReviewForm";
import { SubmitRequestButton } from "@/components/SubmitRequestButton";
import { StructuredFieldsForm } from "@/components/StructuredFieldsForm";
import Link from "next/link";

const INITIAL_ASSISTANT: ChatMessageType = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! First, fill in the Structured selections above (Marketing Function through Additional Stakeholders). Then tell me about your AI use case in a sentence or two — I'll ask one question at a time about the idea, impact, and time involved (without putting you on the spot for formal ROI labels).",
};

type Duplicate = { id: string; use_case: string; similarity: number };

function IdentityForm({
  onConfirm,
}: {
  onConfirm: (name: string, email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.toLowerCase().endsWith("@tipalti.com")) {
      setError("Please use your @tipalti.com email address.");
      return;
    }
    onConfirm(name.trim(), email.trim().toLowerCase());
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Who are you?</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            autoFocus
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@tipalti.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Continue
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export default function IntakePage() {
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

  const [structuredForm, setStructuredForm] = useState<StructuredFormState>(EMPTY_STRUCTURED_FORM);
  const [messages, setMessages] = useState<ChatMessageType[]>([INITIAL_ASSISTANT]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"chat" | "review">("chat");
  const [useCaseData, setUseCaseData] = useState<UseCaseOutput | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);
  const duplicateCheckedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const READY_TOKEN = "[READY_FOR_OUTPUT]";

  const formComplete = useMemo(() => isStructuredFormComplete(structuredForm), [structuredForm]);
  const chatUnlocked = identityConfirmed && formComplete;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const showGenerateButton = readyToGenerate && chatUnlocked && view === "chat" && !useCaseData;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || !chatUnlocked) return;

    const userMessage: ChatMessageType = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setReadyToGenerate(false);
    setIsLoading(true);

    // Run duplicate check on first user message — fire and forget
    if (!duplicateCheckedRef.current) {
      duplicateCheckedRef.current = true;
      setDuplicatesDismissed(false);
      setDuplicateChecking(true);
      fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_case: text }),
      })
        .then((r) => r.json())
        .then((d) => setDuplicates(d.duplicates ?? []))
        .catch(() => {})
        .finally(() => setDuplicateChecking(false));
    }

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, structuredFields: structuredForm }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const assistantId = `assistant-${Date.now()}`;
      let fullContent = "";

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          const hasReady = fullContent.includes(READY_TOKEN);
          const displayContent = hasReady
            ? fullContent.replace(/\s*\[READY_FOR_OUTPUT\]\s*$/g, "").trim()
            : fullContent;
          if (hasReady) setReadyToGenerate(true);
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: displayContent } : m)
          );
        }
        if (fullContent.includes(READY_TOKEN)) {
          setReadyToGenerate(true);
          const finalDisplay = fullContent.replace(/\s*\[READY_FOR_OUTPUT\]\s*$/g, "").trim();
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: finalDisplay } : m)
          );
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: `Sorry, there was an error: ${errMsg}. Please check OPENAI_API_KEY and try again.` },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerate = async () => {
    setGenerateError(null);
    setGenerateLoading(true);
    try {
      const apiMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, structuredFields: structuredForm }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      const generated = json as UseCaseOutput;
      setUseCaseData(generated);
      setView("review");
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerateLoading(false);
    }
  };

  if (view === "review" && useCaseData) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col p-4 md:p-6">
        <header className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">AI Use Case Intake</h1>
              <p className="text-sm text-slate-500 mt-1">
                Review your use case, then submit to the hub and Slack
              </p>
            </div>
            <Link href="/ideas" className="text-sm text-sky-600 hover:text-sky-700 font-medium shrink-0">
              All ideas
            </Link>
          </div>
        </header>

        <div className="flex-1 space-y-6">
          <button
            type="button"
            onClick={() => setView("chat")}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Back to chat
          </button>

          {/* Duplicate warning */}
          {duplicateChecking && (
            <p className="text-xs text-slate-400">Checking for similar ideas…</p>
          )}
          {!duplicateChecking && duplicates.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-amber-800">
                Similar ideas already exist
              </h3>
              <p className="text-xs text-amber-700">
                Your idea looks similar to the following. You can still submit, but consider checking if this has already been captured.
              </p>
              <ul className="space-y-1">
                {duplicates.map((d) => (
                  <li key={d.id} className="text-sm">
                    <a
                      href={`/ideas/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-700 hover:text-sky-900 font-medium underline"
                    >
                      {d.use_case || "Untitled"}
                    </a>
                    <span className="text-xs text-slate-400 ml-2">
                      {Math.round(d.similarity * 100)}% similar
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing info warning */}
          {useCaseData.missing_info && useCaseData.missing_info.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Missing or unclear info</h3>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                {useCaseData.missing_info.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800 mb-1">Structured use case</h2>
            <p className="text-xs text-slate-500 mb-4">
              <span className="font-medium text-slate-600">ROI details</span> and{" "}
              <span className="font-medium text-slate-600">hours saved</span> reflect what you
              described in chat—you can edit them below. The standardized{" "}
              <span className="font-medium text-slate-600">value type</span> and{" "}
              <span className="font-medium text-slate-600">escalation tier</span> are included when
              you submit.
            </p>
            <ReviewForm data={useCaseData} onChange={setUseCaseData} />
          </div>

          <SubmitRequestButton
            data={useCaseData}
            submitterEmail={submitterEmail}
            submitterName={submitterName}
            similarIdeas={duplicates}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col p-4 md:p-6">
      <header className="border-b border-slate-200 pb-4 mb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Use Case Intake</h1>
            <p className="text-sm text-slate-500 mt-1">
              Pick standardized options below, then chat to describe your use case.
            </p>
          </div>
          <Link href="/ideas" className="text-sm text-sky-600 hover:text-sky-700 font-medium shrink-0">
            All ideas
          </Link>
        </div>
      </header>

      {/* Identity step */}
      {!identityConfirmed ? (
        <IdentityForm
          onConfirm={(name, email) => {
            setSubmitterName(name);
            setSubmitterEmail(email);
            setIdentityConfirmed(true);
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Submitting as <span className="font-medium text-slate-800">{submitterName}</span>{" "}
            <span className="text-slate-400">({submitterEmail})</span>
          </span>
          <button
            onClick={() => setIdentityConfirmed(false)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Change
          </button>
        </div>
      )}

      <div className="mb-4 shrink-0">
        <StructuredFieldsForm value={structuredForm} onChange={setStructuredForm} />
        {identityConfirmed && !formComplete && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Complete all structured selections above to unlock the chat.
          </p>
        )}
        {!identityConfirmed && (
          <p className="mt-3 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            Enter your name and email above to unlock the form.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
              <span className="text-slate-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inline duplicate warning during chat */}
      {!duplicatesDismissed && !duplicateChecking && duplicates.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-amber-800">Similar idea already exists</p>
            <button
              onClick={() => setDuplicatesDismissed(true)}
              className="text-amber-400 hover:text-amber-700 text-xs shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-amber-700">You can still continue, but check these first:</p>
          <ul className="space-y-0.5">
            {duplicates.map((d) => (
              <li key={d.id} className="text-sm">
                <a
                  href={`/ideas/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 hover:text-sky-900 font-medium underline"
                >
                  {d.use_case || "Untitled"}
                </a>
                <span className="text-xs text-slate-400 ml-2">{Math.round(d.similarity * 100)}% similar</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {showGenerateButton && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateLoading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generateLoading ? "Generating…" : "Generate structured output"}
            </button>
          </div>
        )}
        {generateError && (
          <p className="text-sm text-rose-600 text-center">{generateError}</p>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              !identityConfirmed
                ? "Enter your name and email above first…"
                : chatUnlocked
                ? "Type your message…"
                : "Complete the form above to chat…"
            }
            rows={2}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isLoading || !chatUnlocked}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !chatUnlocked}
            className="self-end rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
