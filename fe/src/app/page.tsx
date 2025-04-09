import Image from "next/image";
import Link from "next/link";

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
        <h1 className="text-8xl font-bold p-6 text-gray-200 font-motterdam">Tiktok for Singapore History</h1>
      </main>
      <footer className="row-start-3 flex gap-[64px] flex-wrap items-center justify-center">
        <Link href={'#'} className="footer-menu-font !text-2xl">Code/Alibaba-Hackathon-2025</Link>
      </footer>
    </div>
  );
}