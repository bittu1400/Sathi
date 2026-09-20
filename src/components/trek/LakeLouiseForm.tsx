import * as React from "react";
import { Segmented } from "../ui/segmented";

export interface LakeLouiseScores {
  headache: 0 | 1 | 2 | 3;
  gi: 0 | 1 | 2 | 3;
  fatigue: 0 | 1 | 2 | 3;
  dizziness: 0 | 1 | 2 | 3;
}

export interface LakeLouiseFormProps {
  scores: LakeLouiseScores;
  onChange: (newScores: LakeLouiseScores) => void;
}

// Severity descriptors are not in SAFETY.md yet, so only the labels are shown (CHK-2).
const options = [
  { value: 0, label: "None" },
  { value: 1, label: "Mild" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Severe" },
];

const questions: { key: keyof LakeLouiseScores; title: string; hint: string }[] = [
  { key: "headache", title: "Headache", hint: "Do you have a headache?" },
  { key: "gi", title: "Stomach", hint: "Poor appetite, nausea, or vomiting?" },
  { key: "fatigue", title: "Fatigue or weakness", hint: "Unusual tiredness or physical weakness?" },
  { key: "dizziness", title: "Dizziness", hint: "Feeling unsteady or light-headed?" },
];

export function LakeLouiseForm({ scores, onChange }: LakeLouiseFormProps) {
  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <fieldset key={q.key} className="space-y-2">
          <legend className="text-body font-medium">
            {i + 1}. {q.title}
          </legend>
          <p className="text-small text-text-muted">{q.hint}</p>
          <Segmented aria-label={q.title} options={options} value={scores[q.key]} onChange={(val) => onChange({ ...scores, [q.key]: val as 0 | 1 | 2 | 3 })} />
        </fieldset>
      ))}
    </div>
  );
}
