import Hero from "@/components/Hero";
import BlueprintStory from "@/components/BlueprintStory";
import EngineeringStory from "@/components/EngineeringStory";

export default function Home() {
  return (
    <main className="relative z-10">
      <Hero />
      <BlueprintStory />
      <EngineeringStory />
    </main>
  );
}
