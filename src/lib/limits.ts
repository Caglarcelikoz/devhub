import { toast } from 'sonner'

export function showItemLimitToast() {
  toast.error("You've reached the 50-item limit. Upgrade to Pro for unlimited items.", {
    action: {
      label: 'Upgrade',
      onClick: () => { window.location.href = '/settings#billing' },
    },
  })
}
