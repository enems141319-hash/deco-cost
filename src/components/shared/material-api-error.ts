export function materialApiErrorMessage(status: number): string {
  if (status === 401) return "登入已過期，請重新登入後再選擇材料";
  return "材料載入失敗，請稍後再試";
}
