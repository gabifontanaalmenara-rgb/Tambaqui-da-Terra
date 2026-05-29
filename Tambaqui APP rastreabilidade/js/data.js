// Estado Inicial e Dados de Simulação do Tambaqui da Terra

const DEFAULT_STATE = {
  user: {
    username: "produtor",
    email: "produtor@tambaquidaterra.com.br",
    password: "123",
    name: "Manoel da Silva",
    phone: "(92) 98765-4321",
    subscriptionActive: true,
    price: 110.00
  },
  farms: [
    {
      id: "farm-1",
      name: "Fazenda Rio Solimões",
      city: "Iranduba",
      state: "AM",
      cnpj: "12.345.678/0001-99",
      licenseNumber: "L.O. 4352/2024-IPAAM",
      waterOutorga: "OUT-5231/2024",
      carNumber: "AM-1301852-B4D2.E9B4.1234",
      sizeHectares: 3.5,
      isVerified: true
    }
  ],
  activeFarmId: "farm-1",
  tanks: [
    {
      id: "tank-1",
      name: "Tanque Principal",
      type: "Escavado", // Escavado, Alvenaria, Rede
      volume: 150, // m³
      area: 100, // m²
      waterSource: "Igarapé",
      waterAgeDays: 12,
      lastWaterChange: "2026-05-16",
      parameters: {
        temp: 28.5, // °C
        ph: 6.8,
        oxygen: 5.4, // mg/L (ideal > 4.0)
        transparency: 35 // cm (ideal 30-40)
      }
    },
    {
      id: "tank-2",
      name: "Tanque Juvenil",
      type: "Alvenaria",
      volume: 80,
      area: 50,
      waterSource: "Poço Artesiano",
      waterAgeDays: 5,
      lastWaterChange: "2026-05-23",
      parameters: {
        temp: 27.2,
        ph: 7.1,
        oxygen: 6.1,
        transparency: 40
      }
    }
  ],
  fishLots: [
    {
      id: "lot-1",
      name: "Peixes 1",
      tankId: "tank-1",
      quantity: 550, // Total de tambaquis
      initialQuantity: 600, // Inicial de alevinos
      ageDays: 145, // Idade atual em dias
      averageWeight: 850, // gramas por peixe
      averageLength: 32, // cm
      feedType: "Engorda 32% PB", // Tipo de ração atual
      fcr: 1.35, // Feed Conversion Ratio (Conversão Alimentar)
      mortalityRate: 8.3, // % de mortalidade acumulada
      status: "Saudável"
    },
    {
      id: "lot-2",
      name: "Peixes 2",
      tankId: "tank-2",
      quantity: 180,
      initialQuantity: 190,
      ageDays: 45,
      averageWeight: 90,
      averageLength: 12,
      feedType: "Crescimento Inicial 36% PB",
      fcr: 1.15,
      mortalityRate: 5.2,
      status: "Crescimento Acelerado"
    }
  ],
  weather: {
    current: {
      temp: 31,
      condition: "Ensolarado com Nuvens",
      icon: "⛅",
      humidity: 82,
      wind: "9 km/h",
      rainProb: "40%",
      advice: "Condições ótimas de temperatura da água. Alimentar no horário padrão."
    },
    forecast: [
      { day: "Sex", temp: "31°C/24°C", condition: "Pancadas de Chuva", icon: "🌦️", rainProb: "60%", actionAdvice: "Diminuir ração em 20% à tarde devido a chuvas isoladas." },
      { day: "Sáb", temp: "28°C/23°C", condition: "Chuvas Intensas", icon: "⛈️", rainProb: "90%", actionAdvice: "ALERTA: Reduzir ração em 50%! Chuva forte reduz oxigênio e apetite do Tambaqui." },
      { day: "Dom", temp: "29°C/23°C", condition: "Nublado", icon: "☁️", rainProb: "50%", actionAdvice: "Alimentar levemente após o meio-dia quando a água estiver mais aquecida." },
      { day: "Seg", temp: "32°C/24°C", condition: "Ensolarado", icon: "☀️", rainProb: "20%", actionAdvice: "Excelente dia para biometria e transferência de tanques se necessário." },
      { day: "Ter", temp: "33°C/25°C", condition: "Ensolarado e Quente", icon: "🔥", rainProb: "10%", actionAdvice: "Taxa metabólica alta. Acompanhar oxigênio nas horas mais quentes." }
    ]
  },
  market: {
    regions: [
      { name: "Amazonas (Manaus)", price: 13.80, status: "Alta", trend: "+3.2% esta semana" },
      { name: "Rondônia (Porto Velho)", price: 12.50, status: "Estável", trend: "+0.5% esta semana" },
      { name: "Acre (Rio Branco)", price: 12.10, status: "Baixa", trend: "-1.1% esta semana" },
      { name: "Pará (Belém)", price: 14.50, status: "Alta", trend: "+4.1% esta semana" }
    ],
    selectedRegion: "Amazonas (Manaus)",
    history: {
      months: ["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"],
      prices: [12.20, 12.50, 12.90, 13.10, 13.50, 13.80],
      feedCosts: [10.20, 10.30, 9.80, 9.90, 10.10, 9.50] // Custo médio de ração por kg produzido com a IA
    }
  }
};

// Funções para carregar e salvar o estado
function loadAppState() {
  const saved = localStorage.getItem("tambaqui_da_terra_state");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar estado salvo, utilizando padrões.", e);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE)); // Cópia profunda
}

function saveAppState(state) {
  localStorage.setItem("tambaqui_da_terra_state", JSON.stringify(state));
}
