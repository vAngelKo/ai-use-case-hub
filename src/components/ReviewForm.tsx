"use client";

import type { UseCaseOutput } from "@/types";
import { USE_CASE_FIELDS } from "@/types";
import {
  STATUS_OPTIONS,
  MARKETING_FUNCTIONS,
  SUBFUNCTIONS,
  SUBFUNCTIONS_BY_MARKETING_FUNCTION,
  ROI_VALUE_CATEGORIES,
  ESCALATION_TIERS,
} from "@/constants/standards";

const HIDDEN_IN_REVIEW = new Set(["escalation_tier", "roi"]);

interface ReviewFormProps {
  data: UseCaseOutput;
  onChange: (data: UseCaseOutput) => void;
  /** `full` shows tier + ROI selects (e.g. idea detail dashboard). */
  variant?: "review" | "full";
}

const STANDARD_FIELD_OPTIONS: Record<string, readonly string[] | undefined> = {
  marketing_function: MARKETING_FUNCTIONS,
  status: STATUS_OPTIONS,
};

export function ReviewForm({
  data,
  onChange,
  variant = "review",
}: ReviewFormProps) {
  const FIELDS_FOR_REVIEW = USE_CASE_FIELDS.filter(
    (f) => variant === "full" || !HIDDEN_IN_REVIEW.has(f.key)
  );

  const handleChange = (
    key: keyof UseCaseOutput,
    value: string | string[]
  ) => {
    if (key === "missing_info" || key === "suggested_follow_up_questions") {
      onChange({ ...data, [key]: value as string[] });
    } else {
      const next = { ...data, [key]: value as string };
      if (key === "marketing_function") {
        next.subfunction = "";
      }
      onChange(next);
    }
  };

  return (
    <div className="space-y-4">
      {FIELDS_FOR_REVIEW.map(({ key, label, required }) => {
        const isDescription = key === "description";
        const raw = data[key];
        const value = typeof raw === "string" ? raw : "";
        const options =
          key === "subfunction"
            ? ((data.marketing_function
                ? SUBFUNCTIONS_BY_MARKETING_FUNCTION[data.marketing_function]
                : SUBFUNCTIONS) ?? SUBFUNCTIONS)
            : key === "roi"
              ? ROI_VALUE_CATEGORIES
              : key === "escalation_tier"
                ? ESCALATION_TIERS
                : STANDARD_FIELD_OPTIONS[key];

        return (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label}
              {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {options ? (
              <select
                value={value}
                onChange={(e) =>
                  handleChange(key as keyof UseCaseOutput, e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white"
              >
                <option value="">
                  {key === "subfunction" && !data.marketing_function
                    ? "Select Marketing Function first"
                    : `Select ${label}`}
                </option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : isDescription ? (
              <textarea
                value={value}
                onChange={(e) =>
                  handleChange(key as keyof UseCaseOutput, e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-y min-h-[80px]"
                placeholder={label}
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  handleChange(key as keyof UseCaseOutput, e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                placeholder={label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
