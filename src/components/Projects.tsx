import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github, Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedSection, staggerContainer, staggerItem } from "@/components/animations/AnimatedComponents";

const DESCRIPTION_LIMIT = 120;

const ProjectCard = ({ project }: { project: NonNullable<ReturnType<typeof useProjects>["data"]>[number] }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = (project.description?.length ?? 0) > DESCRIPTION_LIMIT;
  const displayDesc = isLong && !expanded
    ? project.description!.slice(0, DESCRIPTION_LIMIT).trimEnd() + "…"
    : project.description;

  return (
    <motion.div
      variants={staggerItem}
      className="group flex flex-col rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
    >
      <div className="relative w-full bg-muted" style={{ height: "200px" }}>
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-muted-foreground/30">
            <Github size={48} />
          </div>
        )}
        {project.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-primary text-xs font-semibold border border-primary/20">
            {project.category}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug">
          {project.title}
        </h3>

        {project.description && (
          <div className="mb-3">
            <p className="text-muted-foreground text-sm leading-relaxed">{displayDesc}</p>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
              </button>
            )}
          </div>
        )}

        {(project.client || project.date) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
            {project.client && (
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-primary" />
                <span>{project.client}</span>
              </div>
            )}
            {project.date && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-primary" />
                <span>{project.date}</span>
              </div>
            )}
          </div>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.map((tag, j) => (
              <span key={j} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-1">
          {project.live_url && (
            <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
              <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} className="mr-1.5" />Live Demo
              </a>
            </Button>
          )}
          {project.github_url && (
            <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Github size={13} className="mr-1.5" />Source
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Projects = () => {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <section id="projects" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) return null;

  return (
    <section id="projects" className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <p className="section-label">Portfolio</p>
          <h2 className="section-title">My Recent Works</h2>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
