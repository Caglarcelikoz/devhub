export function DashboardMockup() {
  const navItems = [
    { label: 'All Items', color: '#e4e4e7', active: true },
    { label: 'Snippets',  color: '#3b82f6' },
    { label: 'Prompts',   color: '#8b5cf6' },
    { label: 'Commands',  color: '#f97316' },
    { label: 'Notes',     color: '#fde047' },
    { label: 'Links',     color: '#10b981' },
  ];

  const cards = [
    { type: 'snippet', title: 'useDebounce hook',  color: '#3b82f6' },
    { type: 'prompt',  title: 'Code Review GPT',   color: '#8b5cf6' },
    { type: 'command', title: 'Docker cleanup',     color: '#f97316' },
    { type: 'note',    title: 'Team onboarding',    color: '#fde047' },
    { type: 'link',    title: 'MDN Web Docs',       color: '#10b981' },
    { type: 'image',   title: 'System diagram',     color: '#ec4899' },
  ];

  return (
    <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden text-xs select-none shadow-2xl">
      {/* Sidebar */}
      <aside className="w-24 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 p-2 flex flex-col gap-1">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold mb-2 text-[10px]">
          dh
        </div>
        {navItems.map((item) => (
          <span
            key={item.label}
            className={`px-1.5 py-1 rounded text-[10px] ${item.active ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
            style={{ color: item.active ? undefined : item.color }}
          >
            {item.label}
          </span>
        ))}
      </aside>

      {/* Cards */}
      <div className="flex-1 p-2 grid grid-cols-2 gap-1.5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded border border-zinc-800 bg-zinc-950 p-1.5 flex flex-col gap-0.5"
            style={{ borderTopColor: card.color, borderTopWidth: 2 }}
          >
            <span className="text-[9px] font-medium" style={{ color: card.color }}>
              {card.type}
            </span>
            <span className="text-zinc-300 text-[10px] leading-tight font-medium">
              {card.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
