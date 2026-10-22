type ClassValue = string | false | null | undefined;

/** Join truthy class names. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
