import Hero from "@/components/Hero";
import BlueprintStory from "@/components/BlueprintStory";
import EngineeringStory from "@/components/EngineeringStory";
import CADStory from "@/components/CADStory";
import ManufacturingStory from "@/components/ManufacturingStory";
import CommissioningStory from "@/components/CommissioningStory";

export default function Home() {
  return (
    <main className="relative z-10">
      <Hero />
      <BlueprintStory />
      <EngineeringStory />
      <CADStory />
      <ManufacturingStory />
      <CommissioningStory />
    </main>
  );
}
