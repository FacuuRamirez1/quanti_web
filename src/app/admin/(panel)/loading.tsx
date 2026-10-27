import { LeadsSkeleton } from "@/components/admin/LeadsSkeleton";

export default function Loading() {
  return (
    <section aria-labelledby="titulo-admin">
      <header>
        <div className="h-4 w-44 rounded bg-[#e4e6e0] animate-pulse" />
        <div className="mt-4 h-10 w-72 rounded bg-[#e4e6e0] animate-pulse" />
        <div className="mt-3 h-4 w-80 rounded bg-[#e4e6e0] animate-pulse" />
      </header>
      <div className="mt-7 grid gap-[22px] md:grid-cols-2">
        <div className="h-[154px] rounded-2xl border border-[#e9eae6] bg-white animate-pulse" />
        <div className="h-[154px] rounded-2xl border border-[#e9eae6] bg-white animate-pulse" />
      </div>
      <div className="mt-[30px] rounded-2xl border border-[#e9eae6] bg-white px-4 pt-5 pb-8 sm:px-[26px]">
        <div className="h-12 rounded-lg bg-[#f2f3f1] animate-pulse" />
        <div className="mt-8">
          <LeadsSkeleton />
        </div>
      </div>
    </section>
  );
}
