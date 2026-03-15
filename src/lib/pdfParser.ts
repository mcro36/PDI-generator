import * as pdfjs from 'pdfjs-dist';

// Configuração do worker para o pdf.js em ambiente Next.js
// @ts-ignore
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export interface ExtractedQuarter {
    number: number;
    content: string;
}

export interface ExtractedData {
    year: string;
    quarters: ExtractedQuarter[];
}

/**
 * Extrai o texto completo de um arquivo PDF.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Analisa o texto extraído para identificar o ano e os conteúdos por bimestre.
 * Esta é uma lógica inicial baseada em palavras-chave que será refinada se necessário.
 */
export function parsePlanningText(text: string): ExtractedData {
    const normalizedText = text.toLowerCase();

    // Identificação do Ano (6º ao 9º)
    let detectedYear = "7º"; // Default
    if (normalizedText.includes("6º") || normalizedText.includes("6°") || normalizedText.includes("sexto")) detectedYear = "6°";
    if (normalizedText.includes("7º") || normalizedText.includes("7°") || normalizedText.includes("sétimo")) detectedYear = "7°";
    if (normalizedText.includes("8º") || normalizedText.includes("8°") || normalizedText.includes("oitavo")) detectedYear = "8°";
    if (normalizedText.includes("9º") || normalizedText.includes("9°") || normalizedText.includes("nono")) detectedYear = "9°";

    const quarters: ExtractedQuarter[] = [];

    // Tenta dividir o texto em blocos baseados em "1º Bimestre", "2º Bimestre", etc.
    // Procuramos por marcadores flexíveis
    const markers = [
        /1[º°ª]\s*bimestre/i,
        /2[º°ª]\s*bimestre/i,
        /3[º°ª]\s*bimestre/i,
        /4[º°ª]\s*bimestre/i
    ];

    let currentPos = 0;
    const indices: number[] = [];

    markers.forEach((marker, idx) => {
        const match = text.slice(currentPos).match(marker);
        if (match && match.index !== undefined) {
            indices.push(currentPos + match.index);
        } else {
            indices.push(-1);
        }
    });

    for (let i = 0; i < 4; i++) {
        const start = indices[i];
        if (start === -1) {
            quarters.push({ number: i + 1, content: "" });
            continue;
        }

        // O fim é o início do próximo marcador ou o fim do texto
        let end = text.length;
        for (let j = i + 1; j < 4; j++) {
            if (indices[j] !== -1) {
                end = indices[j];
                break;
            }
        }

        // Extrai e limpa o texto do bimestre
        let chunk = text.slice(start, end)
            .replace(markers[i], '') // Remove o título do bimestre
            .trim();

        // Limpeza básica de espaços extras
        chunk = chunk.replace(/\s+/g, ' ');

        quarters.push({
            number: i + 1,
            content: chunk.slice(0, 1500) // Limita o tamanho inicial para manter a UI leve
        });
    }

    return {
        year: detectedYear,
        quarters
    };
}
