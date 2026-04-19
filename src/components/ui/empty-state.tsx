interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: () => void
  actionLabel?: string
}

export function EmptyState({ icon, title, description, action, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/8">
          {icon}
        </div>
      )}
      <p className="text-base text-foreground/40">{title}</p>
      {description && <p className="text-sm text-foreground/30">{description}</p>}
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
