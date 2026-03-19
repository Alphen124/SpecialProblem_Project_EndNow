export const formatDate = (date: string | Date): string => {
  return new Date(date).toISOString().split('T')[0];
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const isEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};
