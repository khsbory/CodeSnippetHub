import { useEffect, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Prism from "@/lib/prism-setup";

// Map of language codes to display names
const languageNames: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  css: "CSS",
  scss: "SCSS",
  python: "Python",
  java: "Java",
  csharp: "C#",
  go: "Go",
  ruby: "Ruby",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  php: "PHP",
  markup: "HTML",
  sql: "SQL",
  bash: "Bash",
};

// Map of language codes to badge colors
const languageColors: Record<string, string> = {
  javascript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  typescript: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  jsx: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  tsx: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  css: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  scss: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  python: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  java: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  csharp: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  go: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ruby: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rust: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  kotlin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  swift: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  php: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  markup: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  sql: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  bash: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  showLanguageBadge?: boolean;
  showCopyButton?: boolean;
}

export function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = true,
  maxHeight = "200px",
  showLanguageBadge = true,
  showCopyButton = true,
}: SyntaxHighlighterProps) {
  const { theme } = useTheme();
  const [isCopied, setIsCopied] = useState(false);
  const normalizedLanguage = language.toLowerCase();
  const prismLanguage = normalizedLanguage === "html" ? "markup" : normalizedLanguage;
  
  useEffect(() => {
    if (Prism) {
      Prism.highlightAll();
    }
  }, [code, language, theme]);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };
  
  const displayLanguage = languageNames[normalizedLanguage] || language;
  const badgeColor = languageColors[normalizedLanguage] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  
  return (
    <div className="relative rounded-md overflow-hidden">
      {/* Language badge and copy button */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        {showLanguageBadge && (
          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", badgeColor)}>
            {displayLanguage}
          </span>
        )}
        {showCopyButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-md"
            onClick={copyToClipboard}
            aria-label="Copy code"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
      
      {/* Code block */}
      <div 
        className={cn(
          "bg-muted font-mono text-sm overflow-x-auto",
          showLineNumbers && "line-numbers"
        )}
        style={{ maxHeight }}
      >
        <pre className="p-4">
          <code className={`language-${prismLanguage}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
