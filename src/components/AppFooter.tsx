function formatBuildTime(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch {
    return iso
  }
}

export function AppFooter() {
  const buildNumber = import.meta.env.VITE_BUILD_NUMBER || 'dev'
  const buildTime = formatBuildTime(import.meta.env.VITE_BUILD_TIME)

  return (
    <footer className="text-center text-xs text-slate-600 py-4 px-4">
      <div>Taskly</div>
      <div className="mt-0.5">
        Build #{buildNumber}
        {buildTime ? ` · ${buildTime}` : ''}
      </div>
    </footer>
  )
}
