/** Loading-screen copy chosen by destination, like the game's own screens. */

export type TransitionKind = "menu" | "world" | "back";

export interface LoadingCopy {
  title: string;
  detail: string;
}

export function loadingCopyFor(href: string, from: string): LoadingCopy {
  const path = href.split(/[?#]/)[0];
  if (path === "/") {
    return from.startsWith("/projects/")
      ? { title: "Saving world", detail: "Saving chunks" }
      : { title: "Returning to title screen", detail: "" };
  }
  if (path.startsWith("/projects/")) return { title: "Loading world", detail: "Generating terrain" };
  if (path === "/projects") return { title: "Loading worlds", detail: "Scanning save files" };
  if (path === "/about") return { title: "Loading player data", detail: "Reading profile" };
  if (path === "/skills") return { title: "Preparing inventory", detail: "Sorting items" };
  if (path === "/socials") return { title: "Connecting to servers", detail: "Pinging servers" };
  if (path === "/contact") return { title: "Opening book and quill", detail: "Sharpening quill" };
  if (path === "/settings") return { title: "Loading options", detail: "" };
  return { title: "Loading", detail: "" };
}

/** Parent screen for the Escape key / Back buttons. */
export function parentRoute(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname.startsWith("/projects/")) return "/projects";
  return "/";
}
