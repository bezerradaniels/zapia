/**
 * Bairros de Bom Jesus da Lapa - BA
 * Usados no combobox de bairro do onboarding e configurações do catálogo.
 * A busca é feita sem acento via normalização NFD.
 */
export const BOM_JESUS_DA_LAPA_NEIGHBORHOODS = [
  'Alto da Boa Vista',
  'Alto do Cruzeiro',
  'Bela Vista',
  'Bom Jardim',
  'Centro',
  'Cohab',
  'Conjunto Habitacional',
  'Esperança',
  'Ibiraba',
  'Jardim das Acácias',
  'Jardim das Flores',
  'Jardim Primavera',
  'Lapa',
  'Malhada de Pedras',
  'Mansões do Sol',
  'Morro do Cruzeiro',
  'Nova Esperança',
  'Novo Horizonte',
  'Olhos d\'Água',
  'Paraíso',
  'Pedral',
  'Planaltina',
  'Planalto',
  'Remanso',
  'Santa Cruz',
  'Santa Luzia',
  'Santo Antônio',
  'Santos Dumont',
  'São Francisco',
  'São João',
  'São José',
  'São Luís',
  'São Roque',
  'Sede',
  'Serra do Ramalho',
  'Vale do Sol',
  'Vila Esperança',
  'Vila Nova',
  'Vila Rica',
  'Vila São Pedro',
]

/** Remove acentos e normaliza para busca sem diacríticos */
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Retorna os bairros filtrados pela query (sem necessidade de acentos) */
export function filterNeighborhoods(query: string): string[] {
  const q = normalize(query.trim())
  if (!q) return BOM_JESUS_DA_LAPA_NEIGHBORHOODS
  return BOM_JESUS_DA_LAPA_NEIGHBORHOODS.filter((n) => normalize(n).includes(q))
}

/** Formato de opção pronto para uso em Combobox */
export const NEIGHBORHOOD_OPTIONS = BOM_JESUS_DA_LAPA_NEIGHBORHOODS.map((n) => ({
  value: n,
  label: n,
}))
