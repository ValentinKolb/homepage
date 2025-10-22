if (!import.meta.env.APP_SECRET)
  throw new Error("environment variable APP_SECRET is not defined");

const config = {
  APP_NAME: "Valentin's Blog",
  APP_SECRET: import.meta.env.APP_SECRET,

  BASE_URL: "https://valentin-kolb.blog",
  COPYRIGHT: "Copyright © 2025 Valentin Kolb",

  LOGO: {
    SRC: "/images/logo.png",
    ALT: "Valentin's Blog Logo",
    FAVICON: "/images/favicon.png",
  },

  META: {
    DESCRIPTION:
      "Valentin's Blog is a personal blog about programming, web development, and other topics.",
    AUTHOR: "Valentin Kolb",
  },
};

export default config;
