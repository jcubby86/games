export const eqIgnoreCase = (a?: string, b?: string): boolean => {
  return a?.toLowerCase() === b?.toLowerCase();
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
