"use client";

import dynamic from "next/dynamic";
import ScrollEngine from "@/components/ScrollEngine";
import Nav from "@/components/chrome/Nav";
import Cursor from "@/components/chrome/Cursor";
import Preloader from "@/components/chrome/Preloader";
import ProgressRail from "@/components/chrome/ProgressRail";
import Footer from "@/components/chrome/Footer";
import Hero from "@/components/hero/Hero";
import WorkProvider from "@/components/work/WorkProvider";
import WorkStage from "@/components/work/WorkStage";
import ReelStage from "@/components/reel/ReelStage";
import ConnectStage from "@/components/connect/ConnectStage";
import ConnectField from "@/components/connect/ConnectField";

/**
 * Deferred so their weight stays out of the first load. Neither is on screen
 * when the page opens — the spiders belong to the last stage, and the detail
 * panel only exists once a project is opened — so fetching their code with the
 * hero costs the visitor time for nothing.
 *
 * `ssr: false` on the spiders because they are a canvas driven by pointer and
 * gyroscope: there is no server-rendered form of them to hydrate.
 */
const Spider = dynamic(() => import("@/components/connect/Spider"), {
  ssr: false,
});
const ProjectDetail = dynamic(
  () => import("@/components/work/ProjectDetail"),
  { ssr: false },
);

export default function Page() {
  return (
    <WorkProvider>
      <span id="top" />

      {/* frame loop — renders nothing */}
      <ScrollEngine />

      {/* fixed background stack: connect links */}
      <ConnectField />
      <Spider />

      {/* chrome */}
      <Preloader />
      <Nav />
      <ProgressRail />
      <Cursor />

      {/* `main` is z-10 and spans the document, so on the connect screen it sat
          on top of the link field and swallowed every click meant for it. It
          stays click-through; only the two stages that actually have controls
          take the pointer back. */}
      <main className="pointer-events-none relative z-10">
        <Hero />
        <WorkStage />
        <ReelStage />
        <ConnectStage />
      </main>

      <Footer />


      {/* opens above everything, keeps scroll + active category */}
      <ProjectDetail />
    </WorkProvider>
  );
}
