import { DashboardSection } from "@/pages/Dashboard";
import { ProfileSection } from "./sections/ProfileSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { ServicesSection } from "./sections/ServicesSection";
import { BlogSection } from "./sections/BlogSection";
import { ContactsSection } from "./sections/ContactsSection";
import { PreviewSection } from "./sections/PreviewSection";
import { SettingsSection } from "./sections/SettingsSection";

interface DashboardContentProps {
  section: DashboardSection;
  userId: string;
}

export const DashboardContent = ({ section, userId }: DashboardContentProps) => {
  const renderSection = () => {
    switch (section) {
      case "profile":
        return <ProfileSection userId={userId} />;
      case "skills":
        return <SkillsSection userId={userId} />;
      case "experience":
        return <ExperienceSection userId={userId} />;
      case "education":
        return <EducationSection userId={userId} />;
      case "projects":
        return <ProjectsSection userId={userId} />;
      case "services":
        return <ServicesSection userId={userId} />;
      case "blog":
        return <BlogSection userId={userId} />;
      case "contacts":
        return <ContactsSection userId={userId} />;
      case "settings":
        return <SettingsSection userId={userId} />;
      case "preview":
        return <PreviewSection userId={userId} />;
      default:
        return <ProfileSection userId={userId} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderSection()}
    </div>
  );
};
