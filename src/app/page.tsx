"use client";

import React, { useState } from "react";
import { Upload, FileText, BrainCircuit, Download, Sparkles, ChevronRight, CheckCircle2, AlertCircle, X, Table as TableIcon, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractTextFromPDF, parsePlanningText, ExtractedQuarter } from "@/lib/pdfParser";
import { generatePDIWord } from "@/lib/docxGenerator";

interface PDIRow {
  content: string;
  skill: string;
  methodology: string;
  evidence: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [year, setYear] = useState("7°");
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedQuarters, setExtractedQuarters] = useState<ExtractedQuarter[]>([]);
  const [generatedPdi, setGeneratedPdi] = useState<PDIRow[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setGeneratedPdi(null);

      try {
        setIsParsing(true);
        const text = await extractTextFromPDF(selectedFile);
        const data = parsePlanningText(text);

        setYear(data.year);
        setExtractedQuarters(data.quarters);
      } catch (err) {
        console.error("Erro ao ler PDF:", err);
        setError("Não conseguimos ler este PDF. Verifique se o arquivo não está protegido.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleGeneratePDI = async () => {
    if (!file || !diagnosis) return;

    setError(null);
    setIsGenerating(true);

    try {
      // Consolidamos o conteúdo programático detectado
      const contentText = extractedQuarters.map(q => `Bimestre ${q.number}: ${q.content}`).join("\n\n");

      const response = await fetch("/api/generate-pdi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          content: contentText,
          diagnosis
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar PDI");
      }

      setGeneratedPdi(data.rows);
    } catch (err: any) {
      console.error("Erro na geração:", err);
      setError(err.message || "Falha na comunicação com o Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineText = async (rowIndex: number, field: keyof PDIRow) => {
    if (!generatedPdi || !diagnosis) return;

    const currentText = generatedPdi[rowIndex][field];

    try {
      const response = await fetch("/api/refine-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, diagnosis })
      });

      const data = await response.json();
      if (data.refinedText) {
        const newPdi = [...generatedPdi];
        newPdi[rowIndex][field] = data.refinedText;
        setGeneratedPdi(newPdi);
      }
    } catch (err) {
      console.error("Erro ao refinar:", err);
    }
  };

  const years = ["6°", "7°", "8°", "9°"];

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <BrainCircuit className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">PDI Inteligente</h1>
            <p className="text-slate-500 text-sm font-medium">Assistente de Educação Inclusiva</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="text-sm font-medium text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-all">
            Como funciona
          </button>
          <button className="text-sm font-semibold bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-lg hover:border-slate-300 transition-all">
            Configurações
          </button>
        </div>
      </header>

      <main className="grid lg:grid-cols-5 gap-8">
        {/* Left Column: Inputs */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-accent rounded-full"></span>
              Configuração do PDI
            </h2>

            {/* Year Selector */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 ml-1">Ano Escolar (Fundamental II)</label>
                {file && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Detectado via PDF</span>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`py-2 text-sm font-bold rounded-xl transition-all border-2 ${year === y
                      ? "bg-accent border-accent text-white shadow-md shadow-blue-100"
                      : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                      }`}
                  >
                    {y} Ano
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 ml-1">Conteúdo Programático (PDF)</label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 text-center cursor-pointer group ${file ? "border-green-200 bg-green-50/30" : "border-slate-200 hover:border-accent/40 hover:bg-slate-50/50"
                  } ${isParsing ? "animate-pulse" : ""}`}
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf"
                  disabled={isParsing}
                  onChange={handleFileChange}
                />
                <div className={`p-3 rounded-full transition-colors ${file ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-accent"}`}>
                  {isParsing ? <div className="w-6 h-6 border-4 border-t-accent border-slate-200 rounded-full animate-spin" /> : (file ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />)}
                </div>
                <div>
                  <p className={`text-sm font-bold ${file ? "text-green-700" : "text-slate-600"}`}>
                    {isParsing ? "Extraindo dados..." : (file ? file.name : "Clique ou arraste o PDF")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {file ? "Clique para trocar o arquivo" : "Extração automática de bimestres"}
                  </p>
                </div>
                {file && !isParsing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setExtractedQuarters([]); }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold mt-1 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>

            {/* Diagnosis Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 ml-1">Diagnóstico do Aluno</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Ex: Aluno com TEA, apresenta facilidade com recursos visuais mas dificuldade em abstração..."
                className="w-full h-32 p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-accent outline-none transition-all text-sm text-slate-600 resize-none placeholder:text-slate-300"
              />
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 ml-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                O diagnóstico guiará as adaptações da IA
              </p>
            </div>

            <button
              disabled={!file || !diagnosis || isGenerating || isParsing}
              onClick={handleGeneratePDI}
              className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isGenerating ? "Processando com Gemini..." : "Analisar e Gerar PDI"}
              {!isGenerating && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </section>

        {/* Right Column: Preview/Results */}
        <section className="lg:col-span-3">
          <div className="glass-card h-full min-h-[500px] rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Visual background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

            <AnimatePresence mode="wait">
              {generatedPdi ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-accent" />
                      PDI Gerado
                    </h3>
                    <button
                      onClick={() => setGeneratedPdi(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-accent flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Reiniciar
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">Conteúdo</th>
                          <th className="p-4 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">Habilidade (BNCC)</th>
                          <th className="p-4 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">Metodologia/DUA</th>
                          <th className="p-4 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">Evidência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedPdi.map((row, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                            <td className="p-4 text-xs text-slate-600 border-b border-slate-50 max-w-[150px]">{row.content}</td>
                            <td className="p-4 text-xs text-slate-600 border-b border-slate-50 font-medium relative group">
                              {row.skill}
                              <button onClick={() => handleRefineText(idx, "skill")} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 bg-white shadow-sm rounded-md text-orange-400 hover:scale-110 transition-all">
                                <Sparkles className="w-3 h-3" />
                              </button>
                            </td>
                            <td className="p-4 text-xs text-slate-600 border-b border-slate-50 italic relative group">
                              {row.methodology}
                              <button onClick={() => handleRefineText(idx, "methodology")} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 bg-white shadow-sm rounded-md text-orange-400 hover:scale-110 transition-all">
                                <Sparkles className="w-3 h-3" />
                              </button>
                            </td>
                            <td className="p-4 text-xs text-slate-600 border-b border-slate-50 relative group">
                              {row.evidence}
                              <button onClick={() => handleRefineText(idx, "evidence")} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 bg-white shadow-sm rounded-md text-orange-400 hover:scale-110 transition-all">
                                <Sparkles className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <FileText className="w-4 h-4" /> Exportar Bimestre
                    </button>
                    <button
                      onClick={() => generatePDIWord(year, diagnosis, generatedPdi)}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 rounded-xl text-sm font-bold text-white hover:bg-slate-800 shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4" /> Baixar PDI Completo (.docx)
                    </button>
                  </div>
                </motion.div>
              ) : extractedQuarters.length > 0 && !isGenerating ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-accent" />
                      Conteúdo Extraído por Bimestre
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {extractedQuarters.map((q) => (
                      <div key={q.number} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100 group">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-7 h-7 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:bg-accent group-hover:text-white transition-colors">
                            {q.number}º
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest italic leading-none">Bimestre</h4>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed bg-white/50 p-3 rounded-xl border border-dashed border-slate-200 italic">
                          {q.content || "Nenhum conteúdo identificado para este período."}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-orange-700 leading-normal text-start">
                      <b>Dica:</b> A IA usará estes textos acima como base. Se algum conteúdo estiver faltando, o professor poderá ajustar manualmente na próxima etapa de edição da tabela.
                    </p>
                  </div>
                </motion.div>
              ) : !isGenerating ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center h-full gap-6 text-center py-20"
                >
                  <div className="bg-slate-50 p-8 rounded-full">
                    <FileText className="w-16 h-16 text-slate-300" />
                  </div>
                  <div className="max-w-xs">
                    <h3 className="text-slate-800 font-bold text-xl mb-2">Aguardando Planejamento</h3>
                    <p className="text-slate-400 text-sm leading-relaxed px-4 text-balance">
                      Ao subir o PDF de planejamento anual, extrairemos os conteúdos automaticamente para você.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-1 bg-slate-100 rounded-full" />)}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-6 py-20"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-accent rounded-full animate-spin"></div>
                    <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-accent animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 font-bold text-lg mb-1">
                      Consultando o Especialista...
                    </p>
                    <p className="text-slate-400 text-sm italic">
                      "Personalizando habilidades da BNCC para o {year} ano conforme o diagnóstico informado."
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <footer className="mt-auto pt-8 text-center text-slate-400 text-xs border-top border-slate-100">
        © 2026 PDI Inteligente • Ferramenta de Apoio Docente
      </footer>
    </div>
  );
}
