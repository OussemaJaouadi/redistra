import { toast as baseToast, type ExternalToast } from "sonner"

export type ToastOptions = ExternalToast

type ToastMessage = Parameters<typeof baseToast>[0]

export const toast = {
  success: (message: ToastMessage, options?: ToastOptions) =>
    baseToast.success(message, options),
  info: (message: ToastMessage, options?: ToastOptions) =>
    baseToast.info(message, options),
  fail: (message: ToastMessage, options?: ToastOptions) =>
    baseToast.error(message, options),
}
