// Two date inputs for a list filter (REQ-SRC-06), named `from` and `to` so they
// end up in the URL with the other filters. Both days are included.
// `invalidRange` shows the Thai message under the fields; the list is then not
// filtered by date, so the user sees why and what to change.
export default function DateRangeFields({
  from,
  to,
  invalidRange,
  fromLabel,
  toLabel,
  inputClassName,
  className = "",
}: {
  from?: string;
  to?: string;
  invalidRange: boolean;
  fromLabel: string;
  toLabel: string;
  inputClassName: string;
  className?: string;
}) {
  const errorId = "filter-date-error";
  const describedBy = invalidRange ? errorId : undefined;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`.trim()}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-from" className="text-sm font-medium">
          {fromLabel}
        </label>
        <input
          id="filter-from"
          name="from"
          type="date"
          defaultValue={from ?? ""}
          aria-invalid={invalidRange || undefined}
          aria-describedby={describedBy}
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-to" className="text-sm font-medium">
          {toLabel}
        </label>
        <input
          id="filter-to"
          name="to"
          type="date"
          defaultValue={to ?? ""}
          aria-invalid={invalidRange || undefined}
          aria-describedby={describedBy}
          className={inputClassName}
        />
      </div>
      {invalidRange ? (
        <p id={errorId} role="alert" className="col-span-2 text-sm text-red-700 dark:text-red-400">
          วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด กรุณาเลือกช่วงวันที่ใหม่
          (ตอนนี้ยังไม่ได้กรองตามวันที่)
        </p>
      ) : null}
    </div>
  );
}
