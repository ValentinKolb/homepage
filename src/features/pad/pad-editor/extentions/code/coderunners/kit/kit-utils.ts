// ==========================
// Public API
// ==========================

export const createUtilsAPI = () => ({
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  fetch: fetch.bind(window),
  random: (lowerBound: number = 0, upperBound: number = 1, step?: number) => {
    const randomValue = Math.random() * (upperBound - lowerBound) + lowerBound;
    if (step) {
      return Math.round(randomValue / step) * step;
    }
    return randomValue;
  },
  shuffle: (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
});
