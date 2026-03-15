import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

interface PDIRow {
    content: string;
    skill: string;
    methodology: string;
    evidence: string;
}

export async function generatePDIWord(year: string, diagnosis: string, rows: PDIRow[]) {
    try {
        // Carrega o template da pasta public (no cliente, usaremos fetch)
        const response = await fetch("/PDI.docx");
        const content = await response.arrayBuffer();

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Mapeia os dados para o formato esperado pelo template Word
        // Assumindo que o template tem um loop como {#rows}...{/rows}
        doc.render({
            ano: year,
            diagnostico: diagnosis,
            data: new Date().toLocaleDateString("pt-BR"),
            rows: rows.map(row => ({
                conteudo: row.content,
                habilidade: row.skill,
                metodologia: row.methodology,
                evidencia: row.evidence
            }))
        });

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Trigger download
        const url = window.URL.createObjectURL(out);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `PDI_${year}_Ano.docx`;
        anchor.click();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Erro ao gerar Word:", error);
        throw error;
    }
}
