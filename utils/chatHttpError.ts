/**
 * Map chat/stream HTTP error bodies to i18n-friendly messages.
 * Shared by Playground, useAgentChat, useChatStream.
 */
export function mapChatHttpError(
  status: number,
  text: string,
  t: (key: string) => string,
): string {
  try {
    const parsed = JSON.parse(text)
    if (parsed?.code === 4010) return t('play.noProvider')
    if (parsed?.code === 5016) return t('quota.exhausted')
    if (parsed?.code === 5014) return t('quota.rate')
    if (parsed?.message) return String(parsed.message)
  } catch {
    // not JSON
  }
  return status ? `HTTP ${status}` : t('play.sendFail')
}
