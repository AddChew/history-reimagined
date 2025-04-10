import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen w-full p-8 sm:p-20 relative">
      {/* Full-page background
      <div className="absolute inset-0 -z-10">
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/images/landing.png"
            alt="Vintage Singapore background"
            fill
            className="object-cover opacity-20 sepia"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/70"></div>
        </div>
      </div> */}

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fixed top-0 left-0 w-screen h-screen object-cover z-[-1]"
      >
        <source src="/videos/home.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start relative">
        <h1 className="text-8xl font-bold p-6 text-gray-200 font-motterdam m-auto">History Reimagined</h1>
        <p className="font-queensides text-2xl font-bold pl-16">Generate short videos about Singapore history from text book and source images..</p>
        <div className="flex flex-col gap-[32px] m-auto">
          <Link href="/prompt" className="flex items-center justify-center">
            <Button
              variant="outline"
                style={{ cursor: "pointer" }}
              size="lg"
              className="footer-menu-font !text-black !text-lg bg-gradient-to-r from-white/80 to-slate-200/90 hover:from-white hover:to-slate-300 text-slate-800 border border-slate-200 shadow-md rounded-full px-8 py-6 text-xl font-queensides"
            >
              Try?
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[64px] flex-wrap items-center justify-center">
        <Link href="https://github.com/widyaageng/alikiasu" className="footer-menu-font !text-2xl">code@github/Alibaba-Hackathon-2025</Link>
      </footer>
    </div>
  );
}