function readApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL must use http or https");
  }

  if (
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must contain only scheme, host and optional port",
    );
  }

  return url.origin;
}

export const publicEnv = Object.freeze({ apiUrl: readApiUrl() });
