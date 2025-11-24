const BEIJING_TIMEZONE = "Asia/Shanghai";

function toDate(value?: Date | string | number | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatParts(date: Date): string {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: BEIJING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  });
  return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second}`;
}

export function formatBeijingDateTime(
  value?: Date | string | number | null,
): string | null {
  const date = toDate(value);
  if (!date) return null;
  return formatParts(date);
}

export function getBeijingNow(): Date {
  return new Date();
}

export function formatBeijingDate(
  value?: Date | string | number | null,
): string | null {
  const date = toDate(value);
  if (!date) return null;
  return formatParts(date).split(" ")[0];
}

