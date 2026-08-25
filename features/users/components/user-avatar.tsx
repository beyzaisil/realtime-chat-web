import type { SearchUser } from "../types";

export function UserAvatar({
  user,
  size = "md",
}: {
  user: Pick<SearchUser, "avatarUrl" | "displayName" | "username">;
  size?: "sm" | "md" | "lg";
}) {
  const initial = (user.displayName.trim()[0] ?? user.username[0] ?? "?")
    .toLocaleUpperCase("tr-TR");
  const sizeClass = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-lg",
  }[size];

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 font-bold text-emerald-800 ${sizeClass}`}
      aria-hidden="true"
    >
      {user.avatarUrl === null ? (
        initial
      ) : (
        <img
          src={user.avatarUrl}
          alt=""
          className="size-full object-cover"
        />
      )}
    </span>
  );
}
