export function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm text-ink-muted">Bu sayfa bir sonraki fazda yenilenecek.</p>
        <p className="text-xs text-ink-faint mt-2">Şimdilik eski sürümü kullanabilirsin:</p>
        <a
          href={`/admin/${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-sm text-brand hover:underline mt-2 inline-block"
        >
          Eski sayfaya git
        </a>
      </div>
    </div>
  )
}
