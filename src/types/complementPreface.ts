export type PrefaceOption = {
  id: string;
  label: string;
  position: number;
};

export function parsePrefaceOptions(raw: unknown): PrefaceOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : crypto.randomUUID();
      const label = typeof record.label === "string" ? record.label : "";
      const position = typeof record.position === "number" ? record.position : index;
      return { id, label, position };
    })
    .filter((item): item is PrefaceOption => item !== null)
    .sort((a, b) => a.position - b.position);
}

export function groupHasPreface(group: {
  preface_question?: string | null;
  preface_options?: unknown;
}): boolean {
  const options = parsePrefaceOptions(group.preface_options);
  return Boolean(group.preface_question?.trim()) && options.length >= 2;
}

export function buildPrefaceAnswersPayload(
  groups: Array<{
    id?: string;
    title: string;
    preface_question?: string | null;
    preface_options?: unknown;
  }>,
  answersByGroupTitle: Map<string, string>
) {
  return Array.from(answersByGroupTitle.entries())
    .map(([groupTitle, answerId]) => {
      const group = groups.find((g) => g.title === groupTitle);
      if (!group || !group.id || !groupHasPreface(group)) return null;
      const options = parsePrefaceOptions(group.preface_options);
      const answer = options.find((option) => option.id === answerId);
      if (!answer) return null;
      return {
        group_id: group.id,
        group_title: groupTitle,
        answer_id: answerId,
        answer_label: answer.label,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
