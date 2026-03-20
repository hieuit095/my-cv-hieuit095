import jsPDF from "jspdf";

interface ProfileData {
  full_name: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  twitter_url?: string | null;
  years_experience: number | null;
  projects_completed: number | null;
  clients_served?: number | null;
  awards_won?: number | null;
  profile_image_url?: string | null;
}

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string | null;
  highlights: string[] | null;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  description: string | null;
}

interface Skill {
  name: string;
  category: string;
  proficiency: number | null;
}

interface Project {
  title: string;
  description: string | null;
  tags: string[] | null;
  live_url: string | null;
  github_url: string | null;
}

interface Service {
  title: string;
  description: string | null;
}

interface CVData {
  profile: ProfileData | null;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  services: Service[];
}

interface SectionToggles {
  summary?: boolean;
  experience?: boolean;
  education?: boolean;
  skills?: boolean;
  projects?: boolean;
  services?: boolean;
}

export interface PDFColorOptions {
  sidebarBg: string;
  primary:   string;
  mainText:  string;
  mainBg:    string;
}

export const DEFAULT_PDF_COLORS: PDFColorOptions = {
  sidebarBg: "#0f172a",
  primary:   "#1d4ed8",
  mainText:  "#1e293b",
  mainBg:    "#ffffff",
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const lighten = (rgb: [number, number, number], t: number): [number, number, number] => [
  Math.round(rgb[0] + (255 - rgb[0]) * t),
  Math.round(rgb[1] + (255 - rgb[1]) * t),
  Math.round(rgb[2] + (255 - rgb[2]) * t),
];

const buildColors = (opts: PDFColorOptions) => {
  const primary   = hexToRgb(opts.primary);
  const sidebar   = hexToRgb(opts.sidebarBg);
  const text      = hexToRgb(opts.mainText);
  const bg        = hexToRgb(opts.mainBg);
  return {
    primary,
    primaryLight: lighten(primary, 0.6)  as [number, number, number],
    sidebar,
    sideDiv:      lighten(sidebar, 0.15) as [number, number, number],
    dark:         text,
    text,
    textMuted:    lighten(text, 0.45)    as [number, number, number],
    lightBg:      lighten(bg, 0.3)       as [number, number, number],
    white:        bg,
    accent:       [5, 150, 105]          as [number, number, number],
    sideText:     lighten(sidebar, 0.75) as [number, number, number],
    sideLabel:    lighten(sidebar, 0.55) as [number, number, number],
  };
};

const SIDEBAR_W = 62;
const MARGIN = 12;
const PAGE_H = 297;
const PAGE_W = 210;
const MAIN_X = SIDEBAR_W + MARGIN;
const MAIN_W = PAGE_W - MAIN_X - MARGIN;
const SIDE_TEXT_W = SIDEBAR_W - 10;

const sanitize = (s: string): string =>
  s
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cap = (s: string, max: number) => {
  const clean = sanitize(s);
  return clean.length > max ? clean.slice(0, max - 2) + ".." : clean;
};

const cleanUrl = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const loadCircularImage = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

export const generateCVPdf = async (
  data: CVData,
  sections?: SectionToggles,
  colorOptions?: Partial<PDFColorOptions>
): Promise<void> => {
  const show = (k: keyof SectionToggles) => sections?.[k] !== false;
  const C = buildColors({ ...DEFAULT_PDF_COLORS, ...colorOptions });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let mainY = MARGIN;
  let sideY = MARGIN;

  const profileImg = data.profile?.profile_image_url
    ? await loadCircularImage(data.profile.profile_image_url)
    : null;

  const drawSidebarBg = () => {
    doc.setFillColor(...C.sidebar);
    doc.rect(0, 0, SIDEBAR_W, PAGE_H, "F");
  };

  const addPage = () => {
    doc.addPage();
    mainY = MARGIN;
    sideY = MARGIN;
    drawSidebarBg();
  };

  const checkMain = (needed: number) => {
    if (mainY + needed > PAGE_H - MARGIN - 8) {
      addPage();
    }
  };

  drawSidebarBg();

  // ── Profile photo ──────────────────────────────────────────
  const photoR = 18;
  const photoCX = SIDEBAR_W / 2;
  const photoCY = sideY + photoR + 4;

  doc.setFillColor(...C.primary);
  doc.circle(photoCX, photoCY, photoR + 1.8, "F");

  if (profileImg) {
    doc.addImage(
      profileImg,
      "PNG",
      photoCX - photoR,
      photoCY - photoR,
      photoR * 2,
      photoR * 2
    );
  } else {
    doc.setFillColor(28, 44, 68);
    doc.circle(photoCX, photoCY, photoR, "F");
    const initials = (data.profile?.full_name || "?")
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.primaryLight);
    doc.text(initials, photoCX, photoCY + 5, { align: "center" });
  }

  sideY = photoCY + photoR + 9;

  // ── Name & title ───────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  const nameLines = doc.splitTextToSize(
    sanitize(data.profile?.full_name || "Your Name"),
    SIDE_TEXT_W
  );
  doc.text(nameLines, SIDEBAR_W / 2, sideY, { align: "center" });
  sideY += nameLines.length * 5.2 + 2;

  if (data.profile?.title) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.primaryLight);
    const titleLines = doc.splitTextToSize(sanitize(data.profile.title), SIDE_TEXT_W);
    doc.text(titleLines, SIDEBAR_W / 2, sideY, { align: "center" });
    sideY += titleLines.length * 4 + 4;
  }

  sideY += 2;
  doc.setDrawColor(...C.sideDiv);
  doc.setLineWidth(0.25);
  doc.line(5, sideY, SIDEBAR_W - 5, sideY);
  sideY += 6;

  // ── Sidebar section helper ─────────────────────────────────
  const sideSection = (title: string) => {
    if (sideY > PAGE_H - 30) return;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.primaryLight);
    doc.text(title.toUpperCase(), 5, sideY);
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.7);
    doc.line(5, sideY + 1.5, 5 + 16, sideY + 1.5);
    sideY += 6.5;
  };

  // ── Contact ────────────────────────────────────────────────
  const contacts: { label: string; value: string }[] = [];
  if (data.profile?.location) contacts.push({ label: "Location", value: data.profile.location });
  if (data.profile?.email)    contacts.push({ label: "Email",    value: cap(data.profile.email, 30) });
  if (data.profile?.phone)    contacts.push({ label: "Phone",    value: data.profile.phone });

  if (contacts.length > 0) {
    sideSection("Contact");
    contacts.forEach(({ label, value }) => {
      if (sideY > PAGE_H - 20) return;
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.sideLabel);
      doc.text(label.toUpperCase(), 5, sideY);
      sideY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.sideText);
      const vlines = doc.splitTextToSize(value, SIDE_TEXT_W);
      doc.text(vlines.slice(0, 2), 5, sideY);
      sideY += vlines.slice(0, 2).length * 4 + 3.5;
    });
    sideY += 1;
    doc.setDrawColor(...C.sideDiv);
    doc.setLineWidth(0.2);
    doc.line(5, sideY, SIDEBAR_W - 5, sideY);
    sideY += 5;
  }

  // ── Links ──────────────────────────────────────────────────
  const links: { label: string; url: string }[] = [];
  if (data.profile?.linkedin_url) links.push({ label: "LinkedIn", url: data.profile.linkedin_url });
  if (data.profile?.github_url)   links.push({ label: "GitHub",   url: data.profile.github_url });
  if (data.profile?.website_url)  links.push({ label: "Portfolio",url: data.profile.website_url });
  if (data.profile?.twitter_url)  links.push({ label: "Twitter",  url: data.profile.twitter_url });

  if (links.length > 0) {
    sideSection("Links");
    links.forEach(({ label, url }) => {
      if (sideY > PAGE_H - 20) return;
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.sideLabel);
      doc.text(label.toUpperCase(), 5, sideY);
      sideY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 160, 220);
      doc.text(cap(cleanUrl(url), 28), 5, sideY);
      sideY += 4 + 3;
    });
    sideY += 1;
    doc.setDrawColor(...C.sideDiv);
    doc.setLineWidth(0.2);
    doc.line(5, sideY, SIDEBAR_W - 5, sideY);
    sideY += 5;
  }

  // ── Stats ──────────────────────────────────────────────────
  const stats: { label: string; value: number }[] = [];
  if ((data.profile?.years_experience ?? 0) > 0)
    stats.push({ label: "Yrs Experience", value: data.profile!.years_experience! });
  if ((data.profile?.projects_completed ?? 0) > 0)
    stats.push({ label: "Projects Done", value: data.profile!.projects_completed! });
  if ((data.profile?.clients_served ?? 0) > 0)
    stats.push({ label: "Clients Served", value: data.profile!.clients_served! });
  if ((data.profile?.awards_won ?? 0) > 0)
    stats.push({ label: "Awards Won", value: data.profile!.awards_won! });

  if (stats.length > 0) {
    sideSection("Stats");
    const halfW = (SIDE_TEXT_W - 4) / 2;
    stats.forEach((stat, i) => {
      if (sideY > PAGE_H - 25) return;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xPos = 5 + col * (halfW + 4);
      const yPos = sideY + row * 13;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.primary);
      doc.text(String(stat.value), xPos, yPos);

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.sideText);
      doc.text(stat.label, xPos, yPos + 4);
    });
    sideY += Math.ceil(stats.length / 2) * 13 + 4;
    doc.setDrawColor(...C.sideDiv);
    doc.setLineWidth(0.2);
    doc.line(5, sideY, SIDEBAR_W - 5, sideY);
    sideY += 5;
  }

  // ── Skills ─────────────────────────────────────────────────
  if (show("skills") && data.skills.length > 0) {
    sideSection("Skills");

    const byCategory = data.skills.reduce<Record<string, Skill[]>>((acc, s) => {
      (acc[s.category] = acc[s.category] || []).push(s);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([cat, skills]) => {
      if (sideY > PAGE_H - 20) return;

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.primaryLight);
      doc.text(cap(cat, 22), 5, sideY);
      sideY += 4.5;

      skills.forEach((skill) => {
        if (sideY > PAGE_H - 12) return;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.sideText);
        doc.text(cap(skill.name, 20), 5, sideY);

        const barW = 18;
        const barH = 2;
        const barX = SIDEBAR_W - barW - 5;
        const prof = Math.min(100, Math.max(0, skill.proficiency ?? 70));

        doc.setFillColor(35, 50, 75);
        doc.roundedRect(barX, sideY - 2.5, barW, barH, 0.8, 0.8, "F");
        doc.setFillColor(...C.primary);
        doc.roundedRect(
          barX,
          sideY - 2.5,
          (barW * prof) / 100,
          barH,
          0.8,
          0.8,
          "F"
        );

        sideY += 5;
      });
      sideY += 3;
    });
  }

  // ══ MAIN CONTENT ══════════════════════════════════════════
  mainY = MARGIN;

  // ── Header ─────────────────────────────────────────────────
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(
    sanitize(data.profile?.full_name || "Professional CV"),
    MAIN_X,
    mainY + 8
  );
  mainY += 13;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.primary);
  doc.text(sanitize(data.profile?.title || "Developer"), MAIN_X, mainY);
  mainY += 9;

  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.6);
  doc.line(MAIN_X, mainY, MAIN_X + MAIN_W, mainY);
  mainY += 9;

  // ── Section header helper ──────────────────────────────────
  const mainSection = (title: string): void => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(title.toUpperCase(), MAIN_X, mainY);
    const tw = doc.getTextWidth(title.toUpperCase());
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.7);
    doc.line(MAIN_X, mainY + 1.8, MAIN_X + tw + 2, mainY + 1.8);
    mainY += 8;
  };

  // ── Professional Summary ───────────────────────────────────
  if (show("summary") && data.profile?.bio) {
    checkMain(35);
    mainSection("Professional Summary");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.text);
    const bioLines = doc.splitTextToSize(sanitize(data.profile.bio), MAIN_W);
    doc.text(bioLines, MAIN_X, mainY);
    mainY += bioLines.length * 4.5 + 9;
  }

  // ── Experience ─────────────────────────────────────────────
  if (show("experience") && data.experiences.length > 0) {
    checkMain(35);
    mainSection("Professional Experience");

    data.experiences.forEach((exp) => {
      checkMain(28);

      doc.setFillColor(...C.primary);
      doc.circle(MAIN_X + 2, mainY - 1.5, 1.5, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      const roleText = cap(exp.role, 55);
      doc.text(roleText, MAIN_X + 7, mainY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.primary);
      doc.text(exp.period || "", MAIN_X + MAIN_W, mainY, { align: "right" });
      mainY += 5;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.textMuted);
      doc.text(cap(exp.company, 50), MAIN_X + 7, mainY);
      mainY += 5;

      if (exp.description) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const descLines = doc.splitTextToSize(sanitize(exp.description), MAIN_W - 7);
        doc.text(descLines, MAIN_X + 7, mainY);
        mainY += descLines.length * 4.2 + 2;
      }

      if (exp.highlights && exp.highlights.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...C.text);
        exp.highlights.slice(0, 4).forEach((h) => {
          checkMain(6);
          doc.setFillColor(...C.primaryLight);
          doc.circle(MAIN_X + 11, mainY - 1.2, 1, "F");
          const hLines = doc.splitTextToSize(sanitize(h), MAIN_W - 14);
          doc.text(hLines, MAIN_X + 14, mainY);
          mainY += hLines.length * 4 + 0.5;
        });
      }

      mainY += 7;
    });
  }

  // ── Education ──────────────────────────────────────────────
  if (show("education") && data.education.length > 0) {
    checkMain(25);
    mainSection("Education");

    data.education.forEach((edu) => {
      checkMain(18);

      doc.setFillColor(...C.accent);
      doc.circle(MAIN_X + 2, mainY - 1.5, 1.5, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text(cap(edu.degree, 55), MAIN_X + 7, mainY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.accent);
      doc.text(edu.year || "", MAIN_X + MAIN_W, mainY, { align: "right" });
      mainY += 5;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.textMuted);
      doc.text(cap(edu.institution, 50), MAIN_X + 7, mainY);
      mainY += 4.5;

      if (edu.description) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const descLines = doc.splitTextToSize(sanitize(edu.description), MAIN_W - 7);
        doc.text(descLines.slice(0, 3), MAIN_X + 7, mainY);
        mainY += descLines.slice(0, 3).length * 4;
      }

      mainY += 6;
    });
  }

  // ── Projects ───────────────────────────────────────────────
  if (show("projects") && data.projects.length > 0) {
    checkMain(25);
    mainSection("Featured Projects");

    data.projects.slice(0, 5).forEach((project) => {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(sanitize(project.title), MAIN_W - 8);
      checkMain(titleLines.length * 4.5 + 20);

      doc.setFillColor(...C.primary);
      const dx = MAIN_X + 2;
      const dy = mainY - 2;
      doc.triangle(dx, dy + 3.5, dx + 3.5, dy + 1.5, dx, dy - 0.5, "F");

      doc.setTextColor(...C.dark);
      doc.text(titleLines, MAIN_X + 7, mainY);
      mainY += titleLines.length * 4.5;

      if (project.description) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const dLines = doc.splitTextToSize(sanitize(project.description), MAIN_W - 8);
        doc.text(dLines.slice(0, 2), MAIN_X + 7, mainY);
        mainY += dLines.slice(0, 2).length * 4;
      }

      if (project.tags && project.tags.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(...C.primary);
        doc.text(
          project.tags.slice(0, 5).join("  |  "),
          MAIN_X + 7,
          mainY + 1
        );
        mainY += 5;
      }

      const linkY = mainY + 1;
      let linkX = MAIN_X + 7;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");

      if (project.live_url) {
        doc.setTextColor(100, 160, 220);
        doc.text("Live Demo", linkX, linkY);
        const lw = doc.getTextWidth("Live Demo");
        doc.link(linkX, linkY - 3, lw, 4, { url: project.live_url });
        linkX += lw;
        if (project.github_url) {
          doc.setTextColor(...C.textMuted);
          doc.text("  |  ", linkX, linkY);
          linkX += doc.getTextWidth("  |  ");
        }
      }

      if (project.github_url) {
        doc.setTextColor(100, 160, 220);
        doc.text("Source Code", linkX, linkY);
        const lw = doc.getTextWidth("Source Code");
        doc.link(linkX, linkY - 3, lw, 4, { url: project.github_url });
      }

      if (project.live_url || project.github_url) {
        mainY += 4.5;
      }

      mainY += 5;
    });
  }

  // ── Services ───────────────────────────────────────────────
  if (show("services") && data.services.length > 0) {
    checkMain(22);
    mainSection("Services");

    data.services.forEach((svc) => {
      checkMain(12);

      const sx = MAIN_X + 2;
      const sy = mainY - 1.5;
      const sr = 2;
      doc.setFillColor(...C.primary);
      doc.triangle(sx,      sy - sr, sx + sr, sy,      sx,      sy + sr, "F");
      doc.triangle(sx,      sy - sr, sx - sr, sy,      sx,      sy + sr, "F");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text(cap(svc.title, 55), MAIN_X + 7, mainY);
      mainY += 4.5;

      if (svc.description) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const sLines = doc.splitTextToSize(sanitize(svc.description), MAIN_W - 8);
        doc.text(sLines.slice(0, 2), MAIN_X + 7, mainY);
        mainY += sLines.slice(0, 2).length * 4 + 2;
      }

      mainY += 4;
    });
  }

  // ── Footer on every page ───────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setFillColor(...C.primary);
    doc.rect(SIDEBAR_W, PAGE_H - 6, PAGE_W - SIDEBAR_W, 6, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.white);
    doc.text(
      `Generated ${new Date().toLocaleDateString()}`,
      MAIN_X,
      PAGE_H - 2.5
    );
    doc.text(
      `${p} / ${totalPages}`,
      PAGE_W - MARGIN,
      PAGE_H - 2.5,
      { align: "right" }
    );
  }

  const fileName = data.profile?.full_name
    ? `${data.profile.full_name.replace(/\s+/g, "_")}_CV.pdf`
    : "CV.pdf";
  doc.save(fileName);
};
