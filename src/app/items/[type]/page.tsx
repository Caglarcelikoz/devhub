interface ItemsPageProps {
  params: Promise<{ type: string }>;
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { type } = await params;
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="text-sm text-muted-foreground">
      <h1 className="text-lg font-semibold text-foreground mb-1">{label}</h1>
      <p>Browse your {type}.</p>
    </div>
  );
}
