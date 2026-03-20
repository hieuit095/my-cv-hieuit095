import { useSkills } from "@/hooks/usePortfolioData";

export const SkillsTicker = () => {
  const { data: skills, isLoading } = useSkills();

  if (isLoading || !skills || skills.length === 0) return null;

  const items = [...skills, ...skills, ...skills];

  return (
    <div className="relative w-full overflow-hidden bg-card border-y border-border py-4 select-none">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-card to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-card to-transparent" />

      <div className="flex animate-ticker whitespace-nowrap gap-0">
        {items.map((skill, i) => (
          <div
            key={`${skill.id}-${i}`}
            className="inline-flex items-center gap-2.5 px-5 mx-2 py-2 rounded-full border border-border bg-background/60 hover:border-primary/60 hover:bg-primary/5 transition-colors duration-200 cursor-default shrink-0"
          >
            {skill.icon && (
              <span className="text-lg leading-none">{skill.icon}</span>
            )}
            <span className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {skill.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
