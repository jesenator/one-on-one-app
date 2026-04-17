const COMMON = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export default function TimezoneSelect({
  name,
  defaultValue,
  required,
  className,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const all = Intl.supportedValuesOf("timeZone");
  const rest = all.filter((z) => !COMMON.includes(z)).sort();
  return (
    <select name={name} required={required} defaultValue={defaultValue ?? ""} className={className}>
      {!defaultValue && <option value="" disabled>Select a timezone...</option>}
      <optgroup label="Common">
        {COMMON.map((z) => <option key={z} value={z}>{z}</option>)}
      </optgroup>
      <optgroup label="All timezones">
        {rest.map((z) => <option key={z} value={z}>{z}</option>)}
      </optgroup>
    </select>
  );
}
