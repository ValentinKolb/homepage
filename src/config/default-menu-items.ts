export type MenuItems = {
  nav: {
    name: string | astroHTML.JSX.Element;
    iconClass?: string;
    url: string;
  }[];
  tools: (
    | {
        name: string | astroHTML.JSX.Element;
        url: string;
        iconClass?: string;
        description: string;
      }
    | "Divider"
  )[];
  footer: { name: string | astroHTML.JSX.Element; url: string }[];
};

const DefaultMenu: MenuItems = {
  nav: [
    {
      name: "Projekte",
      url: "/projects",
    },
    {
      name: "Galerie",
      url: "/gallery",
    },
    {
      name: "Blogs",
      url: "/blog",
    },
  ],
  tools: [
    {
      name: "Ollama AI Chat",
      iconClass: "ti-bubble",
      url: "/tools/chat",
      description:
        "Bring your own AI - Chat-Anwendung um mit einem Ollama-Server zu kommunizieren.",
    },
    {
      name: "Pad",
      url: "/tools/pad",
      iconClass: "ti-pencil",
      description:
        "Local First Markdown-Editor mit Kollaboration und Code Execution Features",
    },
    {
      name: "Kiosk",
      url: "/tools/shop",
      iconClass: "ti-building-store",
      description: "Self Service Kiosk System",
    },
  ],
  footer: [
    {
      name: "Über Mich",
      url: "/about",
    },
    {
      name: "Impressum",
      url: "/impressum",
    },
  ],
};

export default DefaultMenu;
