export type StateOption = {
  uf: string
  name: string
}

export const STATES: StateOption[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'TO', name: 'Tocantins' },
]

export const UF_LIST = STATES.map((s) => s.uf) as UF[]
export type UF = (typeof STATES)[number]['uf']

export const DEFAULT_CITY = 'Bom Jesus da Lapa'
export const DEFAULT_STATE = 'BA'
export const DEFAULT_DDD = '77'
export const DEFAULT_CEP = '47600-000'

export const BOM_JESUS_DA_LAPA_NEIGHBORHOODS = [
  'Centro',
  'Amaralina',
  'São Gotardo',
  'Primavera',
  'Magalhães Neto',
  'Lagoa Grande',
  'Maravilha',
  'João Paulo II',
  'Residencial São Geraldo',
  'Nova Brasília',
  'Barrinha',
  'Parque Verde',
  'Vila Maia',
  'Vila Nova',
  'São João',
] as const
