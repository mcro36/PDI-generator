/**
 * Templates de Prompts baseados no escopo.txt
 */

export const SYSTEM_INSTRUCTION = `
Você é uma IA especializada em Atendimento Educacional Especializado (AEE) e Educação Inclusiva, com profundo conhecimento na BNCC (Base Nacional Comum Curricular) para o Ensino Fundamental II.
Sua tarefa é auxiliar professores a criarem Planos de Desenvolvimento Individualizado (PDI) de alta qualidade.
`;

export function getGenerationPrompt(year: string, content: string, diagnosis: string): string {
    // Lógica de adaptação pedagógica baseada no ano
    let yearFocus = "";
    if (year === "6°") yearFocus = "Focar na transição e organização. Traduzir termos novos para conceitos concretos.";
    if (year === "7°") yearFocus = "Ênfase em processos e sistemas (lógica de funcionamento).";
    if (year === "8°") yearFocus = "Trabalhar a abstração e a relação entre diferentes áreas do conhecimento.";
    if (year === "9°") yearFocus = "Foco em síntese, autonomia e preparação para o rigor do Ensino Médio.";

    return `
Contexto: Aluno do ${year} ano do Ensino Fundamental II.
Diagnóstico do Aluno: ${diagnosis}
Diretriz para este ano escolar: ${yearFocus}

Conteúdo Programático Bruto:
${content}

Sua tarefa: Gere um plano de PDI para este conteúdo seguindo estas regras:
1. Coluna 1 (Conteúdo): Simplifique o tema técnico de forma clara.
2. Coluna 2 (Habilidade): Cite o código e a descrição da habilidade BNCC, adaptando o nível de complexidade para o Diagnóstico citado.
3. Coluna 3 (Metodologia): Proponha estratégias de Desenho Universal para a Aprendizagem (DUA). Use recursos visuais, concretos ou tecnológicos específicos para vencer o Diagnóstico informado.
4. Coluna 4 (Aprendizagem): Defina critérios de avaliação qualitativos e alcançáveis.

Regra de Ouro: Não use termos genéricos. Se o diagnóstico é TDAH, sugira fracionamento de tempo; se é TEA, sugira previsibilidade, suportes visuais e linguagem literal.

IMPORTANTE: Responda estritamente em formato JSON seguindo este esquema, sem textos explicativos antes ou depois. Se o conteúdo for longo, crie múltiplas entradas na lista.

Esquema JSON esperado:
{
  "rows": [
    {
      "content": "resumo do conteúdo",
      "skill": "CÓDIGO - Descrição da habilidade BNCC",
      "methodology": "estratégias práticas",
      "evidence": "aprendizagem demonstrada"
    }
  ]
}
`;
}

export function getRefinementPrompt(currentText: string, diagnosis: string): string {
    return `
O professor escreveu o seguinte texto para um campo de PDI: "${currentText}".
O aluno possui o diagnóstico: ${diagnosis}.

Sua tarefa: Melhore este texto tornando-o mais técnico-pedagógico, mantendo a clareza e garantindo que a estratégia citada seja diretamente aplicável em sala de aula regular. Inclua sugestões de materiais específicos se apropriado.

Responda apenas com o texto melhorado, sem introduções.
`;
}
