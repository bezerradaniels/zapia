/**
 * Bairros de Bom Jesus da Lapa - BA
 * Usados no combobox de bairro do onboarding e configurações do catálogo.
 * A busca é feita sem acento via normalização NFD.
 */
export const BOM_JESUS_DA_LAPA_NEIGHBORHOODS = [
  "Alto da Boa Vista",
  "Alto do Cruzeiro",
  "Amaralina",
  "Bela Vista",
  "Bom Jardim",
  "Centro",
  "Cohab",
  "Conjunto Habitacional",
  "Esperança",
  "Ibiraba",
  "Jardim das Acácias",
  "Jardim das Flores",
  "Jardim Primavera",
  "João Paulo II",
  "Lapa",
  "Magalhães Netto",
  "Malhada de Pedras",
  "Mansões do Sol",
  "Maravilha",
  "Morro do Cruzeiro",
  "Nova Brasília",
  "Nova Esperança",
  "Novo Horizonte",
  "Olhos d'Água",
  "Paraíso",
  "Parque Verde",
  "Pedral",
  "Planaltina",
  "Planalto",
  "Primavera",
  "Remanso",
  "Santa Cruz",
  "Santa Luzia",
  "Santo Antônio",
  "Santos Dumont",
  "São Francisco",
  "São João",
  "São João (Barro Vermelho)",
  "São José",
  "São Luís",
  "São Roque",
  "Sede",
  "Serra do Ramalho",
  "Vale do Sol",
  "Vila Esperança",
  "Vila Maia",
  "Vila Nova",
  "Vila Rica",
  "Vila São Pedro",
  "Outro",
];

/** Remove acentos e normaliza para busca sem diacríticos */
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Retorna os bairros filtrados pela query (sem necessidade de acentos) */
export function filterNeighborhoods(query: string): string[] {
  const q = normalize(query.trim());
  if (!q) return BOM_JESUS_DA_LAPA_NEIGHBORHOODS;
  return BOM_JESUS_DA_LAPA_NEIGHBORHOODS.filter((n) =>
    normalize(n).includes(q),
  );
}

/** Formato de opção pronto para uso em Combobox */
export const NEIGHBORHOOD_OPTIONS = BOM_JESUS_DA_LAPA_NEIGHBORHOODS.map(
  (n) => ({
    value: n,
    label: n,
  }),
);
