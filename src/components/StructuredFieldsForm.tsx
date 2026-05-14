"use client";

import type { StructuredFormState } from "@/types";
import {
  STAKEHOLDERS,
  STATUS_OPTIONS,
  MARKETING_FUNCTIONS,
  SUBFUNCTIONS,
  SUBFUNCTIONS_BY_MARKETING_FUNCTION,
} from "@/constants/standards";

interface StructuredFieldsFormProps {
  value: StructuredFormState;
  onChange: (next: StructuredFormState) => void;
}

function parseStakeholderList(s: string): Set<string> {
  if (!s || s === "None") return new Set();
  return new Set(s.split(",").map((x) => x.trim()).filter(Boolean));
}

export function StructuredFieldsForm({
  value,
  onChange,
}: StructuredFieldsFormProps) {
  const subOptions =
    (value.marketing_function
      ? SUBFUNCTIONS_BY_MARKETING_FUNCTION[value.marketing_function]
      : SUBFUNCTIONS) ?? SUBFUNCTIONS;

  const selectedStakeholders = parseStakeholderList(value.additional_stakeholders);
  const noneOnly = value.additional_stakeholders === "None";

  const update = (patch: Partial<StructuredFormState>) => {
    onChange({ ...value, ...patch });
  };

  const toggleStakeholder = (name: string) => {
    if (noneOnly) {
      update({ additional_stakeholders: name });
      return;
    }
    const next = new Set(selectedStakeholders);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    const str = Array.from(next).join(", ");
    update({ additional_stakeholders: str || "" });
  };

  const setStakeholdersNone = () => {
    update({ additional_stakeholders: "None" });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Structured selections
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose these options here. The chat will cover the use case and impact;
          escalation level, hours saved, and ROI summary are filled in when you
          generate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Marketing Function <span className="text-rose-500">*</span>
          </label>
          <select
            value={value.marketing_function}
            onChange={(e) =>
              update({ marketing_function: e.target.value, subfunction: "" })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white"
          >
            <option value="">Select…</option>
            {MARKETING_FUNCTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Subfunction <span className="text-rose-500">*</span>
          </label>
          <select
            value={value.subfunction}
            onChange={(e) => update({ subfunction: e.target.value })}
            disabled={!value.marketing_function}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {value.marketing_function
                ? "Select…"
                : "Select Marketing Function first"}
            </option>
            {subOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={value.status}
            onChange={(e) => update({ status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white"
          >
            <option value="">Select…</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Business Owner <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={value.business_owner}
            onChange={(e) => update({ business_owner: e.target.value })}
            placeholder="Name, role, or team"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">
              Additional Stakeholders <span className="text-rose-500">*</span>
            </legend>
            <p className="text-xs text-slate-500 mb-3">
              Select one or more, or choose &quot;None&quot;.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={setStakeholdersNone}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                  noneOnly
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                None
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAKEHOLDERS.map((name) => {
                const active = !noneOnly && selectedStakeholders.has(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleStakeholder(name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                      active
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}
