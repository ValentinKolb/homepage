// Import mappings
const importMappings = {
  // UI Components
  '@/layouts/components/ui/': '@/components/core/',
  '@/layouts/components/Logo': '@/components/layout/Logo',
  '@/layouts/components/ThemeToggle': '@/components/layout/ThemeToggle',
  '@/layouts/components/Social': '@/components/layout/Social',
  '@/layouts/components/Pagination': '@/components/layout/Pagination',
  '@/layouts/components/TwSizeIndicator': '@/components/layout/TwSizeIndicator',
  
  // Layout components
  '@/layouts/nav/': '@/components/layout/',
  '@/layouts/Base': '@/components/layout/Base',
  '@/layouts/Default': '@/components/layout/Default',
  '@/layouts/BlogsList': '@/components/layout/BlogsList',
  
  // Interactive components
  '@/layouts/components/TicTacToe/': '@/components/interactive/TicTacToe/',
  
  // Media components
  '@/layouts/components/Gallery/': '@/components/media/Gallery/',
  
  // Data components
  '@/layouts/components/ReciYML/': '@/components/data/ReciYML/',
  
  // Features
  '@/layouts/components/Tools/BrowserEditor/': '@/features/browser-editor/',
  '@/layouts/components/Tools/OllamaChat/': '@/features/ollama-chat/',
  
  // Library files
  '@/lib/contentParser': '@/lib/content/contentParser',
  '@/lib/taxonomyParser': '@/lib/content/taxonomyParser',
  '@/lib/yamlLoader': '@/lib/content/yamlLoader',
  '@/lib/color-theme': '@/lib/client/color-theme',
  '@/lib/solidjs/': '@/lib/hooks/'
};

// This script would be used to find and replace all imports in the codebase
console.log('Import mappings for manual updates:');
console.log(JSON.stringify(importMappings, null, 2));