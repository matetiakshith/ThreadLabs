import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function ThreadLabsLanding({ onEnterApp }) {
  return (
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#c49aa0] text-[#241c20]">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-[center_58%]"
        style={{ backgroundImage: "url('/images/threadlabs-pink-studio.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e8ccd0]/10 via-[#8b6475]/5 to-[#403b54]/25" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,transparent_34%,rgba(54,38,48,.18)_100%)]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <div className="font-serif text-[21px] tracking-[-0.06em] sm:text-[25px]">
          thread<span className="font-light italic">labs</span><span className="ml-1 align-top font-sans text-[9px]">®</span>
        </div>
        <nav className="flex items-center gap-4 text-[11px] tracking-wide sm:gap-8 sm:text-sm">
          <span className="hidden sm:inline">An atelier for everyone</span>
          <button onClick={onEnterApp} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 transition hover:scale-105" aria-label="Start designing">
            <ArrowUpRight size={18} strokeWidth={1.6} />
          </button>
        </nav>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-8 max-w-5xl px-6 text-center sm:mt-0"
      >
        <p className="mb-5 text-[9px] font-medium uppercase tracking-[0.32em] sm:text-[11px]">A living atelier · rooted in craft</p>
        <h1 className="font-sans text-[clamp(3.6rem,9vw,8rem)] font-light leading-[0.82] tracking-[-0.075em]">
          <span className="block font-serif italic font-normal tracking-[-0.065em]">Made to be</span>
          <span className="mt-2 block">worn by you.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-md text-xs leading-6 text-[#332830]/80 sm:mt-9 sm:text-sm">
          Your idea, shaped by skilled hands and made for the way you live.
        </p>
        <button
          onClick={onEnterApp}
          className="group mx-auto mt-7 inline-flex items-center gap-3 rounded-full bg-[#fffaf5] px-6 py-3 text-xs shadow-[0_12px_35px_rgba(54,38,48,.15)] transition duration-300 hover:-translate-y-0.5 hover:bg-white sm:mt-9 sm:px-7 sm:py-3.5 sm:text-sm"
        >
          Start your design
          <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </motion.section>

      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-6 pb-5 text-[9px] tracking-wide sm:px-10 sm:pb-7 sm:text-[11px]">
        <span className="max-w-40 leading-4 sm:max-w-none">Thoughtfully made. Made to last.</span>
        <span className="text-right">THREADLABS · 01 / 04</span>
      </footer>
    </main>
  );
}
