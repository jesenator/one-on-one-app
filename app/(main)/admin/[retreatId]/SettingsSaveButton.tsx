"use client";

type Initial = {
  slotsStart: string;
  slotsEnd: string;
  dayStart: string;
  dayEnd: string;
  granularityMinutes: number;
  timezone: string;
};

export default function SettingsSaveButton({ initial }: { initial: Initial }) {
  return (
    <button
      type="submit"
      className="bg-accent-500 text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-accent-600"
      onClick={(e) => {
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
        if (changes.length === 0) return;
        const ok = window.confirm(
          `You're changing: ${changes.join(", ")}.\n\nThese fields define the slot grid. Changing them after people have set availability or booked meetings may orphan their data. Continue?`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      Save settings
    </button>
  );
}
