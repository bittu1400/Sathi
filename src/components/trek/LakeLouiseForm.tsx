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

export function LakeLouiseForm({ scores, onChange }: LakeLouiseFormProps) {
  const options = [
    { value: 0, label: "None" },
    { value: 1, label: "Mild" },
    { value: 2, label: "Moderate" },
    { value: 3, label: "Severe" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Headache */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm text-text">1. Headache</h4>
          <p className="text-xs text-text-muted">Do you have a headache?</p>
        </div>
        <Segmented
          options={options}
          value={scores.headache}
          onChange={(val) => onChange({ ...scores, headache: val as 0 | 1 | 2 | 3 })}
        />
      </div>

      {/* 2. GI Symptoms */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm text-text">2. Gastrointestinal Symptoms</h4>
          <p className="text-xs text-text-muted">Poor appetite, nausea, or vomiting?</p>
        </div>
        <Segmented
          options={options}
          value={scores.gi}
          onChange={(val) => onChange({ ...scores, gi: val as 0 | 1 | 2 | 3 })}
        />
      </div>

      {/* 3. Fatigue / Weakness */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm text-text">3. Fatigue / Weakness</h4>
          <p className="text-xs text-text-muted">Unusual tiredness or physical weakness?</p>
        </div>
        <Segmented
          options={options}
          value={scores.fatigue}
          onChange={(val) => onChange({ ...scores, fatigue: val as 0 | 1 | 2 | 3 })}
        />
      </div>

      {/* 4. Dizziness / Light-headedness */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm text-text">4. Dizziness / Light-headedness</h4>
          <p className="text-xs text-text-muted">Feeling unsteady or dizzy?</p>
        </div>
        <Segmented
          options={options}
          value={scores.dizziness}
          onChange={(val) => onChange({ ...scores, dizziness: val as 0 | 1 | 2 | 3 })}
        />
      </div>
    </div>
  );
}
