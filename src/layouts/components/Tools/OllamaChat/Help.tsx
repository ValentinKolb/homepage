import { type Component } from "solid-js";
import Logo from "./Logo";

const HelpComponent: Component = () => {
  return (
    <div class="flex max-w-[500px] flex-col items-center space-y-4 p-6 text-center text-gray-500">
      {/* Logo */}
      <Logo />

      {/* Einführung */}
      <p>
        Willkommen bei deinem <strong>lokalen Ollama Chat</strong>!{" "}
      </p>

      <p>
        Hier kannst du direkt und sicher mit deinem selbstgehosteten
        Ollama-Server plaudern – ganz ohne, dass deine Daten an fremde Server
        gelangen. Alles wird ausschließlich bei dir lokal in deinem Browser
        gespeichert.
      </p>

      {/* Ollama Website / KI-Modelle */}
      <p>
        Neugierig auf mehr? Alle Infos zu Ollama und wie du deinen eigenen
        Server starten kannst findest du auf der{" "}
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-gray-600"
        >
          offiziellen Ollama Website
        </a>
        {"."}
      </p>

      {/* GitHub Repository */}
      <p>
        Den Quellcode dieses Chat-Clients und weitere Informationen findest du
        in meinem{" "}
        <a
          href="https://github.com/ValentinKolb/homepage/tree/main/src/layouts/components/Tools/OllamaChat"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-gray-600"
        >
          GitHub-Repository
        </a>
        .
      </p>

      {/* Abschließende Bemerkung */}
      <p class="text-xs text-gray-400">
        Viel Spaß beim Chatten und Experimentieren!
      </p>
    </div>
  );
};

export default HelpComponent;
