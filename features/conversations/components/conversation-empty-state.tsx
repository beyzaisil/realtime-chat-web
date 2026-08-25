export function ConversationEmptyState() {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden="true">
            <path d="M7.5 18.5 4 20v-4.25A8 8 0 1 1 7.5 18.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 10h8M8 13.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">Bir sohbet seç</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Konuşma ayrıntılarını görmek için soldaki listeden bir sohbet seç.</p>
      </div>
    </div>
  );
}
