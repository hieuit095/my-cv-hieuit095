import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SkillsTicker } from "@/components/SkillsTicker";
import { Stats } from "@/components/Stats";
import { Services } from "@/components/Services";
import { Timeline } from "@/components/Timeline";
import { Projects } from "@/components/Projects";
import { BlogPreview } from "@/components/BlogPreview";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useSectionVisibility } from "@/hooks/usePortfolioData";

const Index = () => {
  const { data: visibility } = useSectionVisibility();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        {visibility?.show_skills && <SkillsTicker />}
        {visibility?.show_stats && <Stats />}
        {visibility?.show_services && <Services />}
        {(visibility?.show_experience || visibility?.show_education) && (
          <Timeline
            showExperience={visibility?.show_experience}
            showEducation={visibility?.show_education}
          />
        )}
        {visibility?.show_projects && <Projects />}
        {visibility?.show_blog && <BlogPreview />}
        {visibility?.show_contact && <Contact />}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
