import { About } from "@/components/sections/About";
import { AiPromo } from "@/components/sections/AiPromo";
import { Certificate } from "@/components/sections/Certificate";
import { Contact } from "@/components/sections/Contact";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCta } from "@/components/sections/FinalCta";
import { Founder } from "@/components/sections/Founder";
import { Hero } from "@/components/sections/Hero";
import { Portfolio } from "@/components/sections/Portfolio";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Solutions } from "@/components/sections/Solutions";
import { WhyChoose } from "@/components/sections/WhyChoose";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Solutions />
      <Portfolio />
      <About />
      <Certificate />
      <AiPromo />
      <WhyChoose />
      <Process />
      <Founder />
      <FinalCta />
      <Contact />
      <FAQ />
    </>
  );
}
