import Hero from "@/components/Hero";
import BlueprintStory from "@/components/BlueprintStory";
import EngineeringStory from "@/components/EngineeringStory";
import CADStory from "@/components/CADStory";
import ManufacturingStory from "@/components/ManufacturingStory";
import CommissioningStory from "@/components/CommissioningStory";
import AboutNameplate from "@/components/AboutNameplate";
import ProjectDossiers from "@/components/ProjectDossiers";
import ContactTerminal from "@/components/ContactTerminal";

export default function Home() {
  return (
    <main className="relative z-10">
      <Hero />
      <BlueprintStory />
      <EngineeringStory />
      <CADStory />
      <ManufacturingStory />
      <CommissioningStory />
      <AboutNameplate />
      <ProjectDossiers />
      <ContactTerminal />
    </main>
  );
}
