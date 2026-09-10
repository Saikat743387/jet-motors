export default function Download() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-4xl">Download</h1>
      <div className="premium-card mt-5 rounded-2xl p-6">
        <p className="font-display text-3xl">Use JET MOTORS in your browser</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          No APK is required. This is a Progressive Web App. On your phone, open the browser menu
          and choose <strong>Add to Home Screen</strong> to install JET MOTORS like an app.
        </p>
        <div className="mt-5 rounded-xl bg-parchment px-4 py-4 text-sm">
          <p className="font-semibold">iPhone / Safari</p>
          <p className="text-muted">Share → Add to Home Screen</p>
          <p className="mt-3 font-semibold">Android / Chrome</p>
          <p className="text-muted">Menu → Install app / Add to Home screen</p>
        </div>
      </div>
    </div>
  );
}
