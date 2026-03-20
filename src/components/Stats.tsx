import { motion } from "framer-motion";
import { TrendingUp, Users, FolderGit2, Award } from "lucide-react";
import { useProfile } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem } from "@/components/animations/AnimatedComponents";

export const Stats = () => {
  const { data: profile, isLoading } = useProfile();

  const stats = [
    { icon: TrendingUp, value: profile?.years_experience ? `${profile.years_experience}+` : "0", label: "Years Experience" },
    { icon: Users, value: profile?.clients_served ? `${profile.clients_served}+` : "0", label: "Happy Clients" },
    { icon: FolderGit2, value: profile?.projects_completed ? `${profile.projects_completed}+` : "0", label: "Projects Done" },
    { icon: Award, value: profile?.awards_won ? `${profile.awards_won}+` : "0", label: "Awards Won" },
  ];

  const hasStats = profile && (profile.years_experience || profile.clients_served || profile.projects_completed || profile.awards_won);

  if (isLoading) {
    return (
      <section className="py-12 border-y border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-12 h-12 mx-auto mb-3 rounded-lg" />
                <Skeleton className="h-10 w-20 mx-auto mb-1" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!hasStats) return null;

  return (
    <section className="py-12 border-y border-border bg-card/30">
      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={staggerItem} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <stat.icon size={24} />
              </div>
              <div className="text-3xl md:text-4xl font-bold font-display text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
