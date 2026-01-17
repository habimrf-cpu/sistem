
export const formatDateIndo = (dateString: string | undefined | null) => {
  if (!dateString) return '-';
  // Cek apakah formatnya YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};
