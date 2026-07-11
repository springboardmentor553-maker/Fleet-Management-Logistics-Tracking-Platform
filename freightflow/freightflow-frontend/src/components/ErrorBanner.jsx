export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-status-alert/30 bg-status-alert/10 px-4 py-3 text-sm text-status-alert">
      {message}
    </div>
  );
}
