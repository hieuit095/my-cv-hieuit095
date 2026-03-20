import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, X, FileText, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedBlog {
  title: string;
  excerpt: string;
  tags: string;
  reading_time: number;
  content: string;
  cover_image_url: string;
}

interface Props {
  userId: string;
  onGenerated: (data: GeneratedBlog) => void;
  onClose: () => void;
}

type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
};

const INITIAL_STEPS: Step[] = [
  { id: "write", label: "Writing blog post with AI...", status: "pending" },
  { id: "images", label: "Generating images...", status: "pending" },
  { id: "finalize", label: "Finalizing content...", status: "pending" },
];

export const AIBlogGenerator = ({ userId, onGenerated, onClose }: Props) => {
  const [idea, setIdea] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const updateStep = (id: string, status: Step["status"]) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumentName(file.name);
    const text = await file.text();
    setDocumentText(text.slice(0, 8000));
  };

  const removeDocument = () => {
    setDocumentName("");
    setDocumentText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    setError("");
    setGenerating(true);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));

    updateStep("write", "active");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ idea: idea.trim(), documentText, userId }),
        }
      );

      updateStep("write", "done");
      updateStep("images", "active");

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Generation failed");
      }

      updateStep("images", "done");
      updateStep("finalize", "active");

      await new Promise((r) => setTimeout(r, 400));
      updateStep("finalize", "done");

      onGenerated({
        title: data.title,
        excerpt: data.excerpt,
        tags: data.tags,
        reading_time: data.reading_time,
        content: data.content,
        cover_image_url: data.cover_image_url,
      });
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      setSteps((prev) =>
        prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s))
      );
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">AI Blog Generator</h2>
              <p className="text-xs text-muted-foreground">Powered by together.ai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!generating ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your blog idea
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none transition-colors"
                  placeholder="e.g. A deep dive into React Server Components and how they change the way we think about data fetching..."
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {idea.length}/1000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Attach document{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                {documentName ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{documentName}</span>
                    <button onClick={removeDocument} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload .txt or .md file for additional context
                    </span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.md,.mdx,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleGenerate}
                  disabled={!idea.trim()}
                  className="flex-1 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Blog Post
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6 py-2">
              <p className="text-sm text-muted-foreground text-center">
                AI is crafting your blog post. This may take a minute...
              </p>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      {step.status === "pending" && (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                      {step.status === "active" && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                      {step.status === "done" && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                      {step.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        step.status === "active"
                          ? "text-foreground font-medium"
                          : step.status === "done"
                          ? "text-primary"
                          : step.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setGenerating(false); setError(""); setSteps(INITIAL_STEPS); }}>
                      Try Again
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
