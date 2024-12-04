import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { input, number } from "@inquirer/prompts";
import { slugify } from "@/lib/utils/textConverter";

(async () => {
  console.log(chalk.blue("🖼️ Galerie-Generator gestartet...\n"));

  try {
    // Benutzer-Eingaben
    const galleryName = await input({
      message: "Name der Galerie:",
      validate: (value) =>
        value.trim() ? true : "Bitte einen Namen eingeben.",
    });

    const description = await input({
      message: "Beschreibung der Galerie (optional):",
    });

    const blogPost = await input({
      message: "Pfad zum zugehörigen Blogpost (optional):",
    });

    const gallerySlug = await input({
      message: "Slug für die Galerie (URL-Komponente):",
      validate: (value) => (value.trim() ? true : "Bitte einen Slug eingeben."),
      default: slugify(galleryName),
    });

    const totalImages = await number({
      message: "Anzahl der Bilder:",
      validate: (value) =>
        typeof value === "number" && value > 0
          ? true
          : "Bitte eine gültige Anzahl eingeben.",
    });

    const baseUrl = await input({
      message: "Basis-URL der Bilder:",
      validate: (value) =>
        URL.canParse(value) ? true : "Bitte eine Basis-URL eingeben.",
    });

    // Galerie-Daten vorbereiten
    const galleryData = {
      name: galleryName,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(blogPost.trim() ? { blogPost: blogPost.trim() } : {}),
      images: [] as Array<{ src: string; thumb?: string; alt?: string }>,
    };

    console.log(chalk.blue("\n⏳ Generiere Galerie...\n"));

    for (let i = 1; i <= totalImages!; i++) {
      const imageObj = {
        src: `${baseUrl}/img-${i}.jpg`,
        thumb: `${baseUrl}/thumb/img-${i}.jpg`,
        alt: `Bild ${i} (${galleryName})`,
      };
      galleryData.images.push(imageObj);
    }

    // Ausgabe-Verzeichnis erstellen
    const outputDir = path.join(process.cwd(), "src", "content", "gallery");
    fs.ensureDirSync(outputDir);

    // JSON-Datei schreiben
    const outputPath = path.join(outputDir, `${gallerySlug}.json`);
    fs.writeJsonSync(outputPath, galleryData, { spaces: 2 });

    console.log(
      chalk.yellow(`\n🎉 Galerie "${galleryName}" erfolgreich generiert!`),
    );
    console.log(chalk.cyan(`📁 Datei erstellt: ${outputPath}\n`));
  } catch (error) {
    console.error(chalk.red("❌ Fehler beim Generieren der Galerie:"), error);
  }
})();
