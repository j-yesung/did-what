type Props = {
  description?: string;
  title: string;
};

export function ListHeader({ description, title }: Props) {
  return (
    <header className="px-1">
      <h1 className="font-bold text-2xl tracking-[-0.04em]">{title}</h1>
      {description ? <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{description}</p> : null}
    </header>
  );
}
