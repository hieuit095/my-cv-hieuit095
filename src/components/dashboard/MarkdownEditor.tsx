import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link, Image, Code, Quote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const MarkdownEditor = ({ value, onChange, placeholder, maxLength = 50000 }: MarkdownEditorProps) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**", "bold text") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*", "italic text") },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ", "", "Heading") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ", "", "Heading") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ", "", "List item") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ", "", "List item") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ", "", "Quote") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`", "code") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)", "link text") },
    { icon: Image, label: "Image", action: () => insertMarkdown("![", "](url)", "alt text") },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
        <div className="flex items-center justify-between border-b border-border px-2 py-1 bg-muted/30">
          <div className="flex items-center gap-0.5">
            {toolbarButtons.map((btn, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={btn.action}
                title={btn.label}
              >
                <btn.icon size={16} />
              </Button>
            ))}
          </div>
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="write" className="text-xs h-7 px-3">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-7 px-3">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="m-0">
          <textarea
            id="markdown-textarea"
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={16}
            className="w-full px-4 py-3 bg-background text-foreground focus:outline-none resize-none font-mono text-sm"
            placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[384px] px-4 py-3 prose prose-sm dark:prose-invert max-w-none overflow-auto">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview yet...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        {value.length.toLocaleString()} / {maxLength.toLocaleString()} characters
      </div>
    </div>
  );
};
