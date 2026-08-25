import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Couple Finance",
    short_name: "Finance",
    description: "Controle financeiro do casal",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0712",
    theme_color: "#0a0712",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
