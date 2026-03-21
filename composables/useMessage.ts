import { ElMessage } from 'element-plus'

export const useMessage = () => {
  return {
    success: (msg: string) => ElMessage.success(msg),
    error: (msg: string) => ElMessage.error(msg),
    warning: (msg: string) => ElMessage.warning(msg),
    info: (msg: string) => ElMessage.info(msg),
  }
}
