"use client";

import { parsePrefaceOptions, type PrefaceOption } from "@/types/complementPreface";

type ComplementPrefaceSelectorProps = {
  question: string;
  options: PrefaceOption[] | unknown;
  selectedAnswerId?: string;
  onChange: (answerId: string) => void;
  disabled?: boolean;
};

export default function ComplementPrefaceSelector({
  question,
  options,
  selectedAnswerId,
  onChange,
  disabled = false,
}: ComplementPrefaceSelectorProps) {
  const parsedOptions = parsePrefaceOptions(options);

  if (!question.trim() || parsedOptions.length < 2) {
    return null;
  }

  if (parsedOptions.length === 2) {
    return (
      <div className="mb-3 space-y-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{question}</p>
        <div className="grid grid-cols-2 gap-2">
          {parsedOptions.map((option) => {
            const isSelected = selectedAnswerId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{question}</label>
      <select
        disabled={disabled}
        value={selectedAnswerId || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        <option value="" disabled>
          Selecione uma opção
        </option>
        {parsedOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
