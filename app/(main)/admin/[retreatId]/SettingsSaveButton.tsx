"use client";

import { useState } from "react";
import SubmitButton from "../../SubmitButton";

type Initial = {
  slotsStart: string;
  slotsEnd: string;
  dayStart: string;
  dayEnd: string;
  granularityMinutes: number;
  timezone: string;
};

export default function SettingsSaveButton({ initial }: { initial: Initial }) {
  // Grid-field changes require a second click (inline confirm; native
  // window.confirm is banned in this codebase — it silently fails in prod).
  const [armedChanges, setArmedChanges] = useState<string[] | null>(null);

  return (
    <div className="space-y-2">
      {armedChanges && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
          You&rsquo;re changing: <span className="font-semibold">{armedChanges.join(", ")}</span>.
          These fields define the slot grid. Changing them after people have set availability
          or booked meetings may orphan their data. Click{" "}
          <span className="font-semibold">Confirm and save</span> to continue.
        </div>
      )}
      <SubmitButton
        pendingChildren="Saving…"
        successChildren="Saved"
        onClickGuard={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          const get = (n: string) =>
            String((form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "");
          const changes: string[] = [];
          if (get("slotsStart") !== initial.slotsStart) changes.push("Slots start");
          if (get("slotsEnd") !== initial.slotsEnd) changes.push("Slots end");
          if (get("dayStart") !== initial.dayStart) changes.push("Day start");
          if (get("dayEnd") !== initial.dayEnd) changes.push("Day end");
          if (Number(get("granularityMinutes")) !== initial.granularityMinutes) changes.push("Slot minutes");
          if (get("timezone") !== initial.timezone) changes.push("Timezone");
          if (changes.length === 0) {
            setArmedChanges(null);
            return;
          }
          if (armedChanges) {
            setArmedChanges(null);
            return; // second click — let the submit through
          }
          setArmedChanges(changes);
          return false;
        }}
      >
        {armedChanges ? "Confirm and save" : "Save settings"}
      </SubmitButton>
    </div>
  );
}
