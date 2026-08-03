"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { codeApi } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  value: string;
  onChange: (val: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = ["python", "javascript", "java", "cpp"];

interface CodeResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time: number;
}

export default function CodeEditor({ value, onChange, language, onLanguageChange }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  const [stdin, setStdin] = useState("");

  async function runCode() {
    setRunning(true);
    setResult(null);
    try {
      const res = await codeApi.run(value, language, stdin);
      setResult(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setResult({ stdout: "", stderr: err.response?.data?.detail || "Execution failed", exit_code: 1, execution_time: 0 });
    }
    setRunning(false);
  }

  return (
    <div className="flex flex-col h-full bg-[#12121a] rounded-xl border border-[#2a2a3e] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a3e]">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-[#1e1e2e] border border-[#2a2a3e] text-white text-sm rounded-lg px-3 py-1.5 outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          <span className="text-xs text-[#6b6b80]">Code Editor</span>
        </div>
        <button
          onClick={runCode}
          disabled={running}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {running ? (
            <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Running...</>
          ) : (
            <><span>▶</span> Run</>
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={value}
          onChange={(v) => onChange(v || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            folding: true,
            automaticLayout: true,
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Stdin + Output */}
      <div className="border-t border-[#2a2a3e]">
        <div className="flex">
          <div className="flex-1 border-r border-[#2a2a3e] p-3">
            <div className="text-xs text-[#6b6b80] mb-1 font-mono">stdin</div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Optional test input..."
              className="w-full bg-transparent text-sm text-[#e8e8f0] font-mono resize-none outline-none placeholder:text-[#3a3a4e]"
              rows={2}
            />
          </div>
          <div className="flex-1 p-3">
            <div className="text-xs text-[#6b6b80] mb-1 font-mono">
              output {result && <span className={result.exit_code === 0 ? "text-emerald-400" : "text-red-400"}>· exit {result.exit_code} · {result.execution_time}s</span>}
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">
              {result?.stdout && <span className="text-emerald-400">{result.stdout}</span>}
              {result?.stderr && <span className="text-red-400">{result.stderr}</span>}
              {!result && <span className="text-[#3a3a4e]">Run your code to see output</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
