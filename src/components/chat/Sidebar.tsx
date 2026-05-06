"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-6 z-50 bg-white border-r border-slate-100 w-20 lg:w-64 transition-all duration-300">
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white" data-icon="travel">travel</span>
        </div>
        <div className="hidden lg:block overflow-hidden whitespace-nowrap">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">LuxeTravel AI</h1>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-3 py-3 text-slate-500 hover:text-primary hover:bg-blue-50 transition-all rounded-xl group">
          <span className="material-symbols-outlined" data-icon="home">home</span>
          <span className="font-medium text-sm hidden lg:block">Home</span>
        </Link>
        <Link href="/explore" className="flex items-center gap-4 px-3 py-3 text-slate-500 hover:text-primary hover:bg-blue-50 transition-all rounded-xl group">
          <span className="material-symbols-outlined" data-icon="explore">explore</span>
          <span className="font-medium text-sm hidden lg:block">Explore</span>
        </Link>
        <Link href="/chat" className="flex items-center gap-4 px-3 py-3 text-primary bg-blue-50/50 rounded-xl font-semibold">
          <span className="material-symbols-outlined" data-icon="chat">chat</span>
          <span className="font-medium text-sm hidden lg:block">Assistant</span>
        </Link>
        <Link href="/saved" className="flex items-center gap-4 px-3 py-3 text-slate-500 hover:text-primary hover:bg-blue-50 transition-all rounded-xl group">
          <span className="material-symbols-outlined" data-icon="bookmark">bookmark</span>
          <span className="font-medium text-sm hidden lg:block">Saved</span>
        </Link>
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-6">
        <button className="w-full h-12 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center lg:gap-2">
          <span className="material-symbols-outlined" data-icon="add">add</span>
          <span className="text-sm font-semibold hidden lg:block">New Trip</span>
        </button>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="User Profile" className="w-10 h-10 rounded-full object-cover shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ_Mh1o41ASDn_uPVTAsdMx6JVZHiXKF57iND0tC2a12iuUw6jl5ENgNLRN6wWy577wy9L3GAFxLDKW9F_D4MTZb4iG1jgRHMPkdZAccYR-73-LFDC1DLHfo6xtw2rX0EkF98F4KzvAk4LWRuIy-H_Nx96nZDBhoN1cM1Nll9COukYieuuVdtwhfaqYt_oU27xgx8Pt9KbfOf_FSWeZBWzU3hgIuNOFMauNuMTtwXFKTQGOirxR6LKBzY-2ZVZngTlmjBRLj1fyWYa"/>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-slate-900">Alex Rivers</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Gold Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
