export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-semibold">Poligram</h1>
        <p className="text-neutral-300 leading-relaxed">
          Выберите версию:
        </p>

        <div className="flex gap-4 justify-center">
          <a
            href="/lite"
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Lite
          </a>

          <a
            href="/pro"
            className="px-6 py-3 bg-neutral-100 text-neutral-900 rounded"
          >
            Pro
          </a>
        </div>
      </div>
    </main>
  )
}
