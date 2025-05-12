// This script runs before the page loads to prevent flash of wrong theme
(function() {
  // Try to get theme from localStorage first (faster than cookie)
  let theme = localStorage.getItem('theme');
  
  // If no localStorage, check cookie
  if (!theme) {
    theme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
  }

  // If still no theme, check system preference
  if (!theme) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
  }

  // Apply theme
  document.documentElement.classList.add(theme);
})();