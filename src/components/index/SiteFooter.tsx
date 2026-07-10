export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center text-center gap-4">
        <img
          src="/logo.png"
          alt="NIKOLIFE"
          className="h-16 w-auto"
          loading="lazy"
        />
        <div className="space-y-1 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800">© 2018–2026 NIKOLIFE</p>
          <p>ИП Николаева Анна Сергеевна</p>
          <p>ИНН 220301103671</p>
          <p>
            E-mail:{' '}
            <a
              href="mailto:nikolife_team@mail.ru"
              className="text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              nikolife_team@mail.ru
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
