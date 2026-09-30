export function safeNext(value: string | null | undefined): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return null;
  const path = value.split("?")[0];
  if (path.includes("%") || path === "/auth" || path.startsWith("/auth/"))
    return null;
  return value;
}
export function authDestination(
  next: string | null | undefined,
  role?: string,
) {
  const fallback =
    role === "doctor"
      ? "/doctor-dashboard"
      : ["admin", "super_admin"].includes(role || "")
        ? "/admin"
        : "/dashboard";
  const target = safeNext(next);
  return !target || target === "/dashboard" ? fallback : target;
}
