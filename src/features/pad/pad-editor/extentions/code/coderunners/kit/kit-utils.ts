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
  lorem: (count: number = 50) => {
    const words = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
      "enim",
      "ad",
      "minim",
      "veniam",
      "quis",
      "nostrud",
      "exercitation",
      "ullamco",
      "laboris",
      "nisi",
      "aliquip",
      "ex",
      "ea",
      "commodo",
      "consequat",
      "duis",
      "aute",
      "irure",
      "in",
      "reprehenderit",
      "voluptate",
      "velit",
      "esse",
      "cillum",
      "fugiat",
      "nulla",
      "pariatur",
      "excepteur",
      "sint",
      "occaecat",
      "cupidatat",
      "non",
      "proident",
      "sunt",
      "culpa",
      "qui",
      "officia",
      "deserunt",
      "mollit",
      "anim",
      "id",
      "est",
      "laborum",
    ];

    let result = [];
    for (let i = 0; i < count; i++) {
      result.push(words[i % words.length]);
    }

    // Capitalize first word and add period at the end
    if (result.length > 0) {
      result[0] = result[0].charAt(0).toUpperCase() + result[0].slice(1);
      return result.join(" ") + ".";
    }
    return "";
  },
});
