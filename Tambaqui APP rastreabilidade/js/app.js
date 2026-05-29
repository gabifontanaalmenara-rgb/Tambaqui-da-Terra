// Controlador Principal da Interface do Tambaqui da Terra

let state = null;
let currentTab = "boas-vindas";
let selectedLotId = null;
let selectedTankId = null;
let graphIntegrated = false;

// Inicialização da Aplicação
document.addEventListener("DOMContentLoaded", () => {
  // Carrega estado do localStorage ou padrões
  state = loadAppState();
  
  // Inicializa Iara
  Iara.init();
  
  // Configura Ouvintes de Eventos Globais
  setupEventListeners();
  
  // Verifica se o usuário está logado
  checkAuth();
});

// Verifica se o usuário e farm estão cadastrados
function checkAuth() {
  const loggedIn = localStorage.getItem("tambaqui_logged_in");
  if (loggedIn === "true") {
    // Verifica se possui alguma fazenda registrada
    if (state.farms && state.farms.length > 0) {
      showDashboard();
    } else {
      showAuthScreen("register-farm");
    }
  } else {
    showAuthScreen("login");
  }
}

// Exibe telas de Autenticação
function showAuthScreen(screen) {
  document.getElementById("auth-container").style.display = "flex";
  document.getElementById("dashboard-container").style.display = "none";
  
  const loginForm = document.getElementById("login-form-wrapper");
  const registerUserForm = document.getElementById("register-user-wrapper");
  const registerFarmForm = document.getElementById("register-farm-wrapper");
  
  loginForm.style.display = "none";
  registerUserForm.style.display = "none";
  registerFarmForm.style.display = "none";
  
  if (screen === "login") {
    loginForm.style.display = "block";
  } else if (screen === "register-user") {
    registerUserForm.style.display = "block";
  } else if (screen === "register-farm") {
    registerFarmForm.style.display = "block";
  }
}

// Mostra o Dashboard principal
function showDashboard() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard-container").style.display = "flex";
  
  // Atualiza nome da fazenda no cabeçalho
  const activeFarm = state.farms.find(f => f.id === state.activeFarmId);
  if (activeFarm) {
    document.getElementById("header-farm-name").innerText = activeFarm.name;
    document.getElementById("header-user-display").innerText = state.user.name;
  }
  
  // Define sub-abas padrão
  if (state.fishLots.length > 0) selectedLotId = state.fishLots[0].id;
  if (state.tanks.length > 0) selectedTankId = state.tanks[0].id;
  
  // Desenha os painéis e vai para a aba ativa
  switchTab(currentTab);
  
  // Mensagem inicial discreta da Iara na primeira entrada
  setTimeout(() => {
    Iara.addChatBubble("iara", `Olá, ${state.user.name.split(' ')[0]}! Bem-vindo ao Tambaqui da Terra. O Tanque Principal está com ótimas condições de água hoje! Qualquer dúvida me pergunte por voz.`);
  }, 1000);
}

// Gerencia a troca de abas
function switchTab(tabId) {
  currentTab = tabId;
  
  // Atualiza botões da barra lateral
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    }
  });
  
  // Atualiza painéis
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.add("active");
  
  // Renderiza dados específicos da aba selecionada
  renderTabContent(tabId);
}

// Renderiza dados em tempo real para a aba selecionada
function renderTabContent(tabId) {
  switch (tabId) {
    case "boas-vindas":
      renderWelcomeTab();
      break;
    case "meu-tambaqui":
      renderTambaquiTab();
      break;
    case "meu-tanque":
      renderTanqueTab();
      break;
    case "clima":
      renderClimaTab();
      break;
    case "mercado":
      renderMercadoTab();
      break;
    case "perfil":
      renderPerfilTab();
      break;
    case "mais-fazendas":
      renderMaisFazendasTab();
      break;
    case "financeiro":
      renderFinanceiroTab();
      break;
    case "previsao":
      renderPrevisaoTab();
      break;
  }
}

// RENDER: Aba Boas Vindas
function renderWelcomeTab() {
  const greeting = document.getElementById("welcome-greeting");
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  greeting.innerText = `Olá, ${state.user.name}!`;
  document.getElementById("welcome-date").innerText = today.charAt(0).toUpperCase() + today.slice(1);
  
  // Cálculos rápidos de resumo do peixe e tanque
  let statusPeixeText = "Excelente - Lotes saudáveis";
  let statusPeixeSub = "Crescimento esperado de +8g/dia";
  let statusPeixeClass = "stat-subvalue";
  
  let statusTanqueText = "Ideal - Parâmetros ótimos";
  let statusTanqueSub = "pH 6.8 | Temp 28.5°C";
  let statusTanqueClass = "stat-subvalue";

  // Verifica anomalias
  state.tanks.forEach(t => {
    if (t.parameters.oxygen < 4.0 || t.parameters.ph < 6.2 || t.parameters.ph > 8.0) {
      statusTanqueText = "Atenção - Parâmetro fora do padrão";
      statusTanqueSub = `pH: ${t.parameters.ph} | O2: ${t.parameters.oxygen} mg/L`;
      statusTanqueClass = "stat-subvalue alert";
    }
    
    // Densidade
    const lots = state.fishLots.filter(l => l.tankId === t.id);
    const density = Simulation.calculateDensity(t, lots);
    if (density.warningLevel === "danger") {
      statusPeixeText = "Crítico - Lote em Superpopulação";
      statusPeixeSub = `${t.name} acima da capacidade!`;
      statusPeixeClass = "stat-subvalue danger";
    }
  });

  // Atualiza UIs de boas vindas
  const statusPeixeValEl = document.getElementById("summary-fish-status");
  const statusPeixeSubEl = document.getElementById("summary-fish-sub");
  statusPeixeValEl.innerText = statusPeixeText;
  statusPeixeSubEl.innerText = statusPeixeSub;
  statusPeixeSubEl.className = statusPeixeClass;

  const statusTanqueValEl = document.getElementById("summary-tank-status");
  const statusTanqueSubEl = document.getElementById("summary-tank-sub");
  statusTanqueValEl.innerText = statusTanqueText;
  statusTanqueSubEl.innerText = statusTanqueSub;
  statusTanqueSubEl.className = statusTanqueClass;

  // Clima Rápido
  document.getElementById("summary-weather-temp").innerText = `${state.weather.current.temp}°C`;
  document.getElementById("summary-weather-cond").innerText = state.weather.current.condition;
  document.getElementById("summary-weather-icon").innerText = state.weather.current.icon;
  document.getElementById("summary-weather-advice").innerText = `Dica de IA: ${state.weather.current.advice}`;
}

// RENDER: Aba Meu Tambaqui
function renderTambaquiTab() {
  const tabsContainer = document.getElementById("tambaqui-subtabs");
  tabsContainer.innerHTML = "";
  
  // Renderiza sub-abas para cada lote de peixe
  state.fishLots.forEach(lot => {
    const btn = document.createElement("button");
    btn.className = `sub-tab-btn ${selectedLotId === lot.id ? "active" : ""}`;
    btn.innerHTML = `🐟 ${lot.name}`;
    btn.onclick = () => {
      selectedLotId = lot.id;
      renderTambaquiTab();
    };
    tabsContainer.appendChild(btn);
  });
  
  // Botão Adicionar Lote
  const btnAdd = document.createElement("button");
  btnAdd.className = "btn-add-circle";
  btnAdd.innerHTML = "+ Novo Lote";
  btnAdd.onclick = () => openModal("modal-add-lot");
  tabsContainer.appendChild(btnAdd);
  
  // Exibe detalhes do lote selecionado
  const lot = state.fishLots.find(l => l.id === selectedLotId);
  const detailWrapper = document.getElementById("tambaqui-details-wrapper");
  
  if (!lot) {
    detailWrapper.innerHTML = `<p class="subtitle" style="text-align:center; padding: 40px;">Nenhum lote de Tambaqui cadastrado. Clique em '+ Novo Lote' para começar.</p>`;
    return;
  }
  
  const tank = state.tanks.find(t => t.id === lot.tankId);
  const densityData = Simulation.calculateDensity(tank || {area:100, volume:150}, [lot]);
  const feedAdvice = Simulation.calculateFeeding(lot, tank, state.weather.current);
  const harvestPred = Simulation.predictHarvest(lot, densityData, tank ? tank.parameters : {temp:28, ph:7});
  
  detailWrapper.innerHTML = `
    <div class="card-details-main">
      <div class="card-header-actions">
        <h3>Lote: <span id="lot-name-display">${lot.name}</span></h3>
        <div>
          <button class="btn-small" onclick="renameLot('${lot.id}')">✏️ Deseja mudar o nome?</button>
          <button class="btn-small btn-danger-small" onclick="deleteLot('${lot.id}')">❌ Remover</button>
        </div>
      </div>
      
      <div class="grid-parameters">
        <div class="parameter-item">
          <div class="param-name">Tanque Atual</div>
          <div class="param-value">${tank ? tank.name : "Nenhum"}</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Quantidade</div>
          <div class="param-value">${lot.quantity} peixes</div>
          <div class="param-status">Mortalidade: ${lot.mortalityRate}%</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Idade do Lote</div>
          <div class="param-value">${lot.ageDays} dias</div>
          <div class="param-status">Tempo em engorda</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Biometria Média</div>
          <div class="param-value">${lot.averageWeight}g</div>
          <div class="param-status">Comprimento: ${lot.averageLength} cm</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Conversão Alimentar (FCR)</div>
          <div class="param-value">${feedAdvice.adjustedFcr}</div>
          <div class="param-status">Ideal: ${lot.fcr} | Modificado pela densidade</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Previsão de Despesca (1.2kg)</div>
          <div class="param-value">${harvestPred.projectedDate}</div>
          <div class="param-status">${harvestPred.harvestReady ? "PRONTO" : 'Faltam ~' + harvestPred.daysRemaining + ' dias'}</div>
        </div>
      </div>
      
      <div class="ai-advisor-panel">
        <div class="ai-advisor-header">
          <span class="sparkle">✨</span> Gestão de Ração Avançada por IA - Iara
        </div>
        <div class="ai-advisor-content">
          <p><strong>Ração Recomendada:</strong> ${feedAdvice.recommendedFeedType}</p>
          <p style="margin-top: 8px;"><strong>Quantidade Diária Ideal:</strong> ${feedAdvice.dailyFeedKg} kg (Dividir em ${feedAdvice.feedingsPerDay} refeições de ${feedAdvice.feedPerServingKg} kg).</p>
          <p style="margin-top: 8px; color: var(--text-muted);"><em>Recomendação Climática:</em> ${feedAdvice.weatherAdvice}</p>
        </div>
      </div>
      
      ${harvestPred.daysRemaining > 0 && densityData.growthFactor < 0.9 ? `
        <div class="alert-card-warning">
          <span>⚠️</span>
          <div>
            <strong>Aviso de Produtividade:</strong> ${harvestPred.advice}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

// RENDER: Aba Meu Tanque
function renderTanqueTab() {
  const tabsContainer = document.getElementById("tanque-subtabs");
  tabsContainer.innerHTML = "";
  
  state.tanks.forEach(tank => {
    const btn = document.createElement("button");
    btn.className = `sub-tab-btn ${selectedTankId === tank.id ? "active" : ""}`;
    btn.innerHTML = `🌊 ${tank.name}`;
    btn.onclick = () => {
      selectedTankId = tank.id;
      renderTanqueTab();
    };
    tabsContainer.appendChild(btn);
  });
  
  const btnAdd = document.createElement("button");
  btnAdd.className = "btn-add-circle";
  btnAdd.innerHTML = "+ Novo Tanque";
  btnAdd.onclick = () => openModal("modal-add-tank");
  tabsContainer.appendChild(btnAdd);
  
  const tank = state.tanks.find(t => t.id === selectedTankId);
  const detailWrapper = document.getElementById("tanque-details-wrapper");
  
  if (!tank) {
    detailWrapper.innerHTML = `<p class="subtitle" style="text-align:center; padding: 40px;">Nenhum tanque cadastrado. Clique em '+ Novo Tanque' para começar.</p>`;
    return;
  }
  
  // Lotes neste tanque
  const tankLots = state.fishLots.filter(l => l.tankId === tank.id);
  const density = Simulation.calculateDensity(tank, tankLots);
  
  let densityClass = "alert-success";
  if (density.warningLevel === "warning") densityClass = "alert-warning";
  if (density.warningLevel === "danger") densityClass = "alert-danger";
  
  detailWrapper.innerHTML = `
    <div class="card-details-main">
      <div class="card-header-actions">
        <h3>Tanque: <span id="tank-name-display">${tank.name}</span></h3>
        <div>
          <button class="btn-small" onclick="renameTank('${tank.id}')">✏️ Deseja mudar o nome?</button>
          <button class="btn-small" onclick="openTransferModal('${tank.id}')">➡️ Transferir Peixes</button>
          <button class="btn-small btn-danger-small" onclick="deleteTank('${tank.id}')">❌ Remover</button>
        </div>
      </div>
      
      <div class="grid-parameters">
        <div class="parameter-item">
          <div class="param-name">Volume do Tanque</div>
          <div class="param-value">${tank.volume} m³</div>
          <div class="param-status">Tipo: ${tank.type}</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Área Superficial</div>
          <div class="param-value">${tank.area} m²</div>
          <div class="param-status">Origem: ${tank.waterSource}</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Tempo da Água</div>
          <div class="param-value">${tank.waterAgeDays} dias</div>
          <div class="param-status">Última troca: ${tank.lastWaterChange}</div>
        </div>
        <div class="parameter-item ${densityClass}">
          <div class="param-name">Densidade Atual</div>
          <div class="param-value">${density.densityPerM2} peixes/m²</div>
          <div class="param-status">Status: ${density.status}</div>
        </div>
      </div>

      <h4 style="margin-bottom: 12px; color: var(--primary);">Parâmetros da Água (Medição de Hoje)</h4>
      <div class="grid-parameters" style="margin-bottom: 25px;">
        <div class="parameter-item ${tank.parameters.temp > 32 || tank.parameters.temp < 24 ? "alert-warning" : "alert-success"}">
          <div class="param-name">Temperatura</div>
          <div class="param-value">${tank.parameters.temp} °C</div>
          <div class="param-status">Ideal: 26°C - 30°C</div>
        </div>
        <div class="parameter-item ${tank.parameters.ph < 6.5 || tank.parameters.ph > 7.5 ? "alert-warning" : "alert-success"}">
          <div class="param-name">pH da Água</div>
          <div class="param-value">${tank.parameters.ph}</div>
          <div class="param-status">Ideal: 6.5 - 7.5</div>
        </div>
        <div class="parameter-item ${tank.parameters.oxygen < 4.0 ? "alert-danger" : "alert-success"}">
          <div class="param-name">Oxigênio Dissolvido</div>
          <div class="param-value">${tank.parameters.oxygen} mg/L</div>
          <div class="param-status">Crítico: < 4.0 mg/L</div>
        </div>
        <div class="parameter-item">
          <div class="param-name">Transparência</div>
          <div class="param-value">${tank.parameters.transparency} cm</div>
          <div class="param-status">Ideal: 30 - 40 cm</div>
        </div>
      </div>
      
      <div class="ai-advisor-panel">
        <div class="ai-advisor-header">
          <span class="sparkle">✨</span> Análise do Tanque por IA - Iara
        </div>
        <div class="ai-advisor-content">
          <p><strong>Diagnóstico de Povoamento:</strong> ${density.message}</p>
          <p style="margin-top: 8px;"><strong>Status da Água:</strong> ${tank.waterAgeDays > 10 ? `Água envelhecida (${tank.waterAgeDays} dias). Recomenda-se realizar troca parcial (20%) nas próximas 48 horas.` : "Qualidade física e biológica da água está estável. Sem necessidade de trocas urgentes."}</p>
        </div>
      </div>
    </div>
  `;
}

// RENDER: Aba Clima
function renderClimaTab() {
  const cur = state.weather.current;
  
  // Renderiza Clima Atual
  document.getElementById("weather-main-temp").innerText = `${cur.temp}°C`;
  document.getElementById("weather-main-cond").innerText = cur.condition;
  document.getElementById("weather-main-icon").innerText = cur.icon;
  document.getElementById("weather-main-humidity").innerText = `Umidade: ${cur.humidity}%`;
  document.getElementById("weather-main-wind").innerText = `Vento: ${cur.wind}`;
  document.getElementById("weather-main-rain").innerText = `Probabilidade de Chuva: ${cur.rainProb}`;
  document.getElementById("weather-main-advice").innerText = cur.advice;
  
  // Renderiza Previsão Semanal
  const forecastList = document.getElementById("weather-forecast-list");
  forecastList.innerHTML = "";
  
  state.weather.forecast.forEach(item => {
    const row = document.createElement("div");
    row.className = "weather-forecast-item";
    row.innerHTML = `
      <div class="wf-day">${item.day}</div>
      <div class="wf-temp">${item.temp}</div>
      <div class="wf-icon-desc"><span>${item.icon}</span> <span style="font-size: 0.8rem;">${item.rainProb}</span></div>
      <div class="wf-advice">${item.actionAdvice}</div>
    `;
    forecastList.appendChild(row);
  });
}

// RENDER: Aba Mercado e Gráficos
function renderMercadoTab() {
  const regionList = document.getElementById("market-regions-list");
  regionList.innerHTML = "";
  
  state.market.regions.forEach(reg => {
    const card = document.createElement("div");
    card.className = `region-price-card ${state.market.selectedRegion === reg.name ? "active" : ""}`;
    card.innerHTML = `
      <div>
        <div class="region-name">${reg.name}</div>
        <div class="region-trend ${reg.status === 'Alta' ? '' : reg.status === 'Baixa' ? 'down' : ''}">${reg.trend}</div>
      </div>
      <div class="price-tag">R$ ${reg.price.toFixed(2)}/kg</div>
    `;
    card.onclick = () => {
      state.market.selectedRegion = reg.name;
      saveAppState(state);
      renderMercadoTab();
    };
    regionList.appendChild(card);
  });
  
  // Desenha gráfico do Canvas se integrado
  drawMarketChart();
}

// Desenha gráfico explicativo de custos vs lucro e preços
function drawMarketChart() {
  const canvas = document.getElementById("market-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  // Limpa o canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!graphIntegrated) {
    // Exibe prompt do botão de integração
    document.getElementById("market-chart-placeholder").style.display = "flex";
    canvas.style.display = "none";
    return;
  }
  
  document.getElementById("market-chart-placeholder").style.display = "none";
  canvas.style.display = "block";
  
  // Configuração das dimensões do canvas para retina/densidade
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  canvas.width = width;
  canvas.height = height;
  
  const months = state.market.history.months;
  const prices = state.market.history.prices;
  const feedCosts = state.market.history.feedCosts;
  
  // Desenha fundo e linhas guia
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  // Linhas horizontais de grade (4 divisões)
  for (let i = 0; i <= 4; i++) {
    const y = paddingTop + (graphHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    
    // Label Y (Valores R$)
    ctx.fillStyle = "#a0aec0";
    ctx.font = "10px Outfit";
    const val = 15 - (i * 2);
    ctx.fillText(`R$ ${val.toFixed(2)}`, 10, y + 4);
  }
  
  // Desenha os pontos e linhas das séries
  const drawLine = (data, color, shadowColor) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
      const x = paddingLeft + (graphWidth / (data.length - 1)) * i;
      // Mapeia valor entre R$ 7.00 e R$ 15.00
      const minVal = 7.00;
      const maxVal = 15.00;
      const ratio = (data[i] - minVal) / (maxVal - minVal);
      const y = paddingTop + graphHeight - (graphHeight * ratio);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reseta sombra
  };
  
  // Série 1: Preço de Venda do Tambaqui (Azul)
  drawLine(prices, "#00b4d8", "rgba(0, 180, 216, 0.4)");
  
  // Série 2: Custo de Produção/Ração com Gestão de IA (Verde - economizando custos)
  drawLine(feedCosts, "#2ec4b6", "rgba(46, 196, 182, 0.4)");
  
  // Labels X (Meses) e Pontos das séries
  for (let i = 0; i < months.length; i++) {
    const x = paddingLeft + (graphWidth / (months.length - 1)) * i;
    ctx.fillStyle = "#a0aec0";
    ctx.font = "11px Outfit";
    ctx.fillText(months[i], x - 10, height - 15);
    
    // Desenha pequenos círculos nas interseções
    const minVal = 7.00;
    const maxVal = 15.00;
    
    // Ponto Preço
    const yPrice = paddingTop + graphHeight - (graphHeight * ((prices[i] - minVal) / (maxVal - minVal)));
    ctx.fillStyle = "#00b4d8";
    ctx.beginPath();
    ctx.arc(x, yPrice, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Ponto Custo Ração
    const yCost = paddingTop + graphHeight - (graphHeight * ((feedCosts[i] - minVal) / (maxVal - minVal)));
    ctx.fillStyle = "#2ec4b6";
    ctx.beginPath();
    ctx.arc(x, yCost, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  // Legenda
  ctx.fillStyle = "#fff";
  ctx.font = "11px Outfit";
  ctx.fillStyle = "#00b4d8";
  ctx.fillRect(paddingLeft + 10, 10, 10, 10);
  ctx.fillStyle = "#fff";
  ctx.fillText("Preço do Tambaqui/Kg", paddingLeft + 25, 19);
  
  ctx.fillStyle = "#2ec4b6";
  ctx.fillRect(paddingLeft + 160, 10, 10, 10);
  ctx.fillStyle = "#fff";
  ctx.fillText("Custo Médio de Ração/Kg (com IA)", paddingLeft + 175, 19);
}

// RENDER: Aba Perfil
function renderPerfilTab() {
  document.getElementById("profile-name").value = state.user.name;
  document.getElementById("profile-email").value = state.user.email;
  document.getElementById("profile-phone").value = state.user.phone;
  
  const farm = state.farms.find(f => f.id === state.activeFarmId);
  if (farm) {
    document.getElementById("profile-farm-name").value = farm.name;
    document.getElementById("profile-farm-license").value = farm.licenseNumber;
    document.getElementById("profile-farm-outorga").value = farm.waterOutorga;
    document.getElementById("profile-farm-car").value = farm.carNumber;
  }
}

// RENDER: Aba Mais Fazendas
function renderMaisFazendasTab() {
  const farmList = document.getElementById("additional-farms-list");
  farmList.innerHTML = "";
  
  state.farms.forEach(f => {
    const verifiedBadge = f.isVerified 
      ? `<span style="color: var(--success); font-weight: bold;">✓ Verificada Legalmente</span>`
      : `<span style="color: var(--warning); font-weight: bold;">⚠ Pendente</span>`;
      
    const activeText = f.id === state.activeFarmId 
      ? `<span class="farm-badge">Ativa</span>` 
      : `<button class="btn-small" onclick="selectActiveFarm('${f.id}')">Alternar para esta</button>`;
      
    const item = document.createElement("div");
    item.className = "parameter-item";
    item.style.marginBottom = "15px";
    item.style.display = "flex";
    item.style.justify = "space-between";
    item.style.alignItems = "center";
    item.innerHTML = `
      <div>
        <div class="param-value" style="font-size: 1.1rem;">${f.name}</div>
        <div class="param-status">${f.city} - ${f.state} | ${verifiedBadge}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Licença: ${f.licenseNumber}</div>
      </div>
      <div>
        ${activeText}
      </div>
    `;
    farmList.appendChild(item);
  });
}

// RENDER: Aba Financeiro (Simulação do Ciclo)
function renderFinanceiroTab() {
  const countInput = document.getElementById("slide-fin-fish-count");
  const feedInput = document.getElementById("slide-fin-feed-price");
  const saleInput = document.getElementById("slide-fin-sale-price");
  
  const fishCount = parseInt(countInput.value);
  const feedPrice = parseFloat(feedInput.value);
  const salePrice = parseFloat(saleInput.value);
  
  // Atualiza rótulos dos Sliders
  document.getElementById("val-fin-fish-count").innerText = fishCount.toLocaleString('pt-BR');
  document.getElementById("val-fin-feed-price").innerText = `R$ ${feedPrice.toFixed(2).replace('.', ',')}`;
  document.getElementById("val-fin-sale-price").innerText = `R$ ${salePrice.toFixed(2).replace('.', ',')}`;
  
  // Realiza cálculos de simulação
  const result = Simulation.simulateFinancials(fishCount, feedPrice, salePrice);
  
  // Atualiza Cenário Empírico (Manejo Tradicional) na Tela
  document.getElementById("fin-emp-harvest-count").innerText = `${result.emp.harvestCount.toLocaleString('pt-BR')} peixes`;
  document.getElementById("fin-emp-biomass").innerText = `${parseFloat(result.emp.biomassKg).toLocaleString('pt-BR')} kg`;
  document.getElementById("fin-emp-feed-used").innerText = `${parseFloat(result.emp.feedUsedKg).toLocaleString('pt-BR')} kg`;
  document.getElementById("fin-emp-feed-cost").innerText = `R$ ${parseFloat(result.emp.feedCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("fin-emp-profit").innerText = `R$ ${parseFloat(result.emp.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Atualiza Cenário Otimizado (Com IA) na Tela
  document.getElementById("fin-ia-harvest-count").innerText = `${result.ia.harvestCount.toLocaleString('pt-BR')} peixes`;
  document.getElementById("fin-ia-biomass").innerText = `${parseFloat(result.ia.biomassKg).toLocaleString('pt-BR')} kg`;
  document.getElementById("fin-ia-feed-used").innerText = `${parseFloat(result.ia.feedUsedKg).toLocaleString('pt-BR')} kg`;
  document.getElementById("fin-ia-feed-cost").innerText = `R$ ${parseFloat(result.ia.feedCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("fin-ia-profit").innerText = `R$ ${parseFloat(result.ia.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Atualiza Destaque de Diferença
  const diffProfitText = parseFloat(result.profitDifference) >= 0 
    ? `R$ ${parseFloat(result.profitDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `R$ ${parseFloat(result.profitDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Porcentagem de aumento de lucro
  const empProfitNum = parseFloat(result.emp.profit);
  const diffProfitNum = parseFloat(result.profitDifference);
  let profitPercentGrowth = 0;
  if (empProfitNum > 0) {
    profitPercentGrowth = Math.round((diffProfitNum / empProfitNum) * 100);
  } else {
    profitPercentGrowth = 400; // Valor ilustrativo caso lucro empírico seja negativo/zero
  }
  
  document.getElementById("fin-diff-profit").innerText = `${diffProfitText} (+${profitPercentGrowth}%)`;
  document.getElementById("fin-diff-feed").innerText = `${parseFloat(result.feedSavedKg).toLocaleString('pt-BR')} kg`;
  document.getElementById("fin-diff-feed-cost").innerText = `R$ ${parseFloat(result.feedSavingsCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// RENDER: Aba Previsão (Sobrevivência e Perdas)
function renderPrevisaoTab() {
  const countInput = document.getElementById("slide-fin-fish-count"); // Usa o mesmo slider para sincronizar
  const saleInput = document.getElementById("slide-fin-sale-price");   // Usa o mesmo slider
  
  const fishCount = parseInt(countInput.value);
  const salePrice = parseFloat(saleInput.value);
  
  // Executa cálculos de sobrevivência
  const result = Simulation.simulateSurvival(fishCount, salePrice);
  
  // Atualiza Dados Cenário Empírico (Manejo Tradicional)
  document.getElementById("prev-emp-lost-qty").innerText = `${result.emp.lost.toLocaleString('pt-BR')} peixes`;
  document.getElementById("prev-emp-lost-value").innerText = `R$ ${parseFloat(result.emp.lostRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Atualiza Dados Cenário Otimizado (IA)
  document.getElementById("prev-ia-lost-qty").innerText = `${result.ia.lost.toLocaleString('pt-BR')} peixes`;
  document.getElementById("prev-ia-lost-value").innerText = `R$ ${parseFloat(result.ia.lostRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Atualiza Barra de Progresso e Textos
  const empBar = document.getElementById("bar-emp-survival");
  const empText = document.getElementById("bar-emp-text");
  empBar.style.width = `${result.emp.survivalPercent}%`;
  empText.innerText = `${result.emp.survived.toLocaleString('pt-BR')} vivos / ${result.emp.lost.toLocaleString('pt-BR')} mortos`;
  
  const iaBar = document.getElementById("bar-ia-survival");
  const iaText = document.getElementById("bar-ia-text");
  iaBar.style.width = `${result.ia.survivalPercent}%`;
  iaText.innerText = `${result.ia.survived.toLocaleString('pt-BR')} vivos / ${result.ia.lost.toLocaleString('pt-BR')} mortos`;
  
  // Atualiza Economia de Vidas
  document.getElementById("prev-diff-fish-saved").innerText = `${result.fishSaved.toLocaleString('pt-BR')} peixes`;
  document.getElementById("prev-diff-loss-saved").innerText = `R$ ${parseFloat(result.financialLossDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// SELEÇÃO DE FAZENDA ATIVA
function selectActiveFarm(farmId) {
  state.activeFarmId = farmId;
  saveAppState(state);
  
  // Atualiza UIs e recarrega
  showDashboard();
}

// RENOMEAR LOTE (Meu Tambaqui)
function renameLot(lotId) {
  const lot = state.fishLots.find(l => l.id === lotId);
  if (!lot) return;
  
  // Abre o prompt customizado/padrão conforme solicitado ("sempre perguntando: deseja mudar o nome?")
  const confirmRename = confirm(`Deseja mudar o nome do lote "${lot.name}"?`);
  if (confirmRename) {
    const newName = prompt("Insira o novo nome para o lote de peixes:", lot.name);
    if (newName && newName.trim() !== "") {
      lot.name = newName.trim();
      saveAppState(state);
      renderTambaquiTab();
    }
  }
}

// APAGAR LOTE
function deleteLot(lotId) {
  if (confirm("Tem certeza que deseja remover este lote? Essa ação é permanente e apagará todos os dados históricos.")) {
    state.fishLots = state.fishLots.filter(l => l.id !== lotId);
    if (state.fishLots.length > 0) {
      selectedLotId = state.fishLots[0].id;
    } else {
      selectedLotId = null;
    }
    saveAppState(state);
    renderTambaquiTab();
  }
}

// RENOMEAR TANQUE (Meu Tanque)
function renameTank(tankId) {
  const tank = state.tanks.find(t => t.id === tankId);
  if (!tank) return;
  
  const confirmRename = confirm(`Deseja mudar o nome do tanque "${tank.name}"?`);
  if (confirmRename) {
    const newName = prompt("Insira o novo nome para o tanque:", tank.name);
    if (newName && newName.trim() !== "") {
      tank.name = newName.trim();
      saveAppState(state);
      renderTanqueTab();
    }
  }
}

// APAGAR TANQUE
function deleteTank(tankId) {
  // Verifica se há lotes de peixes associados
  const hasLots = state.fishLots.some(l => l.tankId === tankId);
  if (hasLots) {
    alert("Não é possível remover este tanque porque existem lotes de tambaqui ativos nele. Transfira os peixes primeiro!");
    return;
  }
  
  if (confirm("Tem certeza que deseja remover este tanque?")) {
    state.tanks = state.tanks.filter(t => t.id !== tankId);
    if (state.tanks.length > 0) {
      selectedTankId = state.tanks[0].id;
    } else {
      selectedTankId = null;
    }
    saveAppState(state);
    renderTanqueTab();
  }
}

// ABRE MODAL DE TRANSFERÊNCIA DE PEIXES
function openTransferModal(tankId) {
  const lotSelect = document.getElementById("transfer-lot-select");
  const destSelect = document.getElementById("transfer-dest-select");
  
  lotSelect.innerHTML = "";
  destSelect.innerHTML = "";
  
  // Lotes neste tanque
  const lots = state.fishLots.filter(l => l.tankId === tankId);
  lots.forEach(lot => {
    const opt = document.createElement("option");
    opt.value = lot.id;
    opt.innerText = `${lot.name} (${lot.quantity} peixes)`;
    lotSelect.appendChild(opt);
  });
  
  // Outros tanques de destino
  const destTanks = state.tanks.filter(t => t.id !== tankId);
  destTanks.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = t.name;
    destSelect.appendChild(opt);
  });
  
  if (lots.length === 0) {
    alert("Não há lotes de peixes neste tanque para transferir!");
    return;
  }
  
  if (destTanks.length === 0) {
    alert("Crie um segundo tanque primeiro para poder transferir os peixes!");
    return;
  }
  
  openModal("modal-transfer");
}

// PROCESSA TRANSFERÊNCIA DE PEIXES
function processTransfer() {
  const lotId = document.getElementById("transfer-lot-select").value;
  const destTankId = document.getElementById("transfer-dest-select").value;
  const quantityToTransfer = parseInt(document.getElementById("transfer-quantity").value);
  
  const lot = state.fishLots.find(l => l.id === lotId);
  const sourceTank = state.tanks.find(t => t.id === lot.tankId);
  const destTank = state.tanks.find(t => t.id === destTankId);
  
  if (!lot || !destTank) return;
  
  if (isNaN(quantityToTransfer) || quantityToTransfer <= 0 || quantityToTransfer > lot.quantity) {
    alert("Quantidade de transferência inválida. Deve ser menor ou igual ao total de peixes do lote.");
    return;
  }
  
  // Se for transferir o lote inteiro
  if (quantityToTransfer === lot.quantity) {
    lot.tankId = destTankId;
  } else {
    // Transfere apenas parte dividindo o lote
    lot.quantity -= quantityToTransfer;
    
    // Cria novo lote no destino
    const newLotId = "lot-" + Date.now();
    state.fishLots.push({
      id: newLotId,
      name: `${lot.name} (Divisão)`,
      tankId: destTankId,
      quantity: quantityToTransfer,
      initialQuantity: quantityToTransfer,
      ageDays: lot.ageDays,
      averageWeight: lot.averageWeight,
      averageLength: lot.averageLength,
      feedType: lot.feedType,
      fcr: lot.fcr,
      mortalityRate: 0,
      status: lot.status
    });
  }
  
  saveAppState(state);
  closeModal("modal-transfer");
  
  // Avisa no chat da Iara
  Iara.speak(`Transferência realizada! Movidos ${quantityToTransfer} peixes de ${sourceTank.name} para ${destTank.name}. A densidade de peixes foi recalculada com sucesso!`);
  
  renderTanqueTab();
}

// CONTROLE DE MODAIS
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// CONFIGURA OS EVENTOS DA TELA E DOS BOTÕES
function setupEventListeners() {
  // Login Form Submit
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const userVal = document.getElementById("login-user").value;
    const passVal = document.getElementById("login-pass").value;
    
    if (userVal === state.user.username && passVal === state.user.password) {
      localStorage.setItem("tambaqui_logged_in", "true");
      showDashboard();
    } else {
      alert("Usuário ou senha incorretos! (Dica: use produtor / 123)");
    }
  });
  
  // Abrir cadastro de usuário
  document.getElementById("link-register").addEventListener("click", () => {
    showAuthScreen("register-user");
  });
  
  // Voltar ao login
  document.getElementById("link-login").addEventListener("click", () => {
    showAuthScreen("login");
  });
  
  // Cadastrar usuário submit (leva para registrar fazenda)
  document.getElementById("register-user-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.user.name = document.getElementById("reg-name").value;
    state.user.email = document.getElementById("reg-email").value;
    state.user.password = document.getElementById("reg-pass").value;
    state.user.username = document.getElementById("reg-username").value;
    
    saveAppState(state);
    showAuthScreen("register-farm");
  });
  
  // Cadastrar fazenda legalmente
  document.getElementById("register-farm-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("farm-name-input").value;
    const city = document.getElementById("farm-city-input").value;
    const stateVal = document.getElementById("farm-state-input").value;
    const license = document.getElementById("farm-license-input").value;
    const outorga = document.getElementById("farm-outorga-input").value;
    const car = document.getElementById("farm-car-input").value;
    
    const newFarm = {
      id: "farm-" + Date.now(),
      name,
      city,
      state: stateVal,
      cnpj: "Pessoa Física (Cadastro Legal)",
      licenseNumber: license,
      waterOutorga: outorga,
      carNumber: car,
      sizeHectares: 2.0,
      isVerified: true
    };
    
    state.farms.push(newFarm);
    state.activeFarmId = newFarm.id;
    saveAppState(state);
    
    localStorage.setItem("tambaqui_logged_in", "true");
    showDashboard();
  });
  
  // Logins sociais (simulado)
  document.querySelectorAll(".btn-social").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("Conectando de forma segura com login social...");
      setTimeout(() => {
        // Assume sucesso e verifica farm
        localStorage.setItem("tambaqui_logged_in", "true");
        checkAuth();
      }, 1200);
    });
  });
  
  // Botão Sair / Logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.setItem("tambaqui_logged_in", "false");
    window.location.reload();
  });
  
  // Tab Routing clicks
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
  
  // Integração com Gráficos no Mercado
  document.getElementById("btn-integrate-market-charts").addEventListener("click", () => {
    graphIntegrated = true;
    renderMercadoTab();
  });
  
  // Formulário de Cadastro de Novo Lote de Peixes
  document.getElementById("form-add-lot").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("add-lot-name").value;
    const tankId = document.getElementById("add-lot-tank").value;
    const qty = parseInt(document.getElementById("add-lot-qty").value);
    const weight = parseFloat(document.getElementById("add-lot-weight").value);
    const age = parseInt(document.getElementById("add-lot-age").value);
    
    // Pergunta se deseja mudar o nome padrão
    const confirmRename = confirm(`Deseja manter o nome "${name}" ou mudar?`);
    let finalName = name;
    if (!confirmRename) {
      const chosenName = prompt("Qual nome de lote você prefere?", name);
      if (chosenName && chosenName.trim() !== "") {
        finalName = chosenName.trim();
      }
    }
    
    const newLot = {
      id: "lot-" + Date.now(),
      name: finalName,
      tankId,
      quantity: qty,
      initialQuantity: qty,
      ageDays: age,
      averageWeight: weight,
      averageLength: Math.round(Math.sqrt(weight) * 1.1), // Estimativa de comprimento
      feedType: weight < 150 ? "Inicial 36% PB" : "Engorda 32% PB",
      fcr: 1.25,
      mortalityRate: 0,
      status: "Aclimatando"
    };
    
    state.fishLots.push(newLot);
    selectedLotId = newLot.id;
    saveAppState(state);
    closeModal("modal-add-lot");
    renderTambaquiTab();
    
    // Avisa na IA
    Iara.speak(`Excelente! Criei o novo lote ${finalName} com sucesso. Ele foi adicionado ao ${state.tanks.find(t => t.id === tankId).name}. A ração diária ideal já foi calculada!`);
  });

  // Formulário de Cadastro de Novo Tanque
  document.getElementById("form-add-tank").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("add-tank-name").value;
    const type = document.getElementById("add-tank-type").value;
    const vol = parseFloat(document.getElementById("add-tank-vol").value);
    const area = parseFloat(document.getElementById("add-tank-area").value);
    const water = document.getElementById("add-tank-water").value;
    
    // Pergunta se deseja mudar o nome
    const confirmRename = confirm(`Deseja manter o nome "${name}" ou mudar?`);
    let finalName = name;
    if (!confirmRename) {
      const chosenName = prompt("Qual nome você prefere para o novo tanque?", name);
      if (chosenName && chosenName.trim() !== "") {
        finalName = chosenName.trim();
      }
    }
    
    const newTank = {
      id: "tank-" + Date.now(),
      name: finalName,
      type,
      volume: vol,
      area,
      waterSource: water,
      waterAgeDays: 1,
      lastWaterChange: new Date().toISOString().split('T')[0],
      parameters: {
        temp: 28.0,
        ph: 7.0,
        oxygen: 6.0,
        transparency: 40
      }
    };
    
    state.tanks.push(newTank);
    selectedTankId = newTank.id;
    saveAppState(state);
    closeModal("modal-add-tank");
    renderTanqueTab();
    
    Iara.speak(`Parabéns! O novo tanque ${finalName} está pronto. Já configurei o monitoramento de parâmetros e densidade para ele.`);
  });
  
  // Salvar alterações de Perfil
  document.getElementById("form-profile").addEventListener("submit", (e) => {
    e.preventDefault();
    
    state.user.name = document.getElementById("profile-name").value;
    state.user.email = document.getElementById("profile-email").value;
    state.user.phone = document.getElementById("profile-phone").value;
    
    const farm = state.farms.find(f => f.id === state.activeFarmId);
    if (farm) {
      farm.name = document.getElementById("profile-farm-name").value;
      farm.licenseNumber = document.getElementById("profile-farm-license").value;
      farm.waterOutorga = document.getElementById("profile-farm-outorga").value;
      farm.carNumber = document.getElementById("profile-farm-car").value;
    }
    
    saveAppState(state);
    alert("Perfil e dados legais da fazenda atualizados com sucesso!");
    showDashboard();
  });
  
  // Solicitar permissão e cadastro de mais fazendas (Verificação de CNPJ/Licenças)
  document.getElementById("form-add-farm").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("add-farm-name").value;
    const stateVal = document.getElementById("add-farm-state").value;
    const cnpj = document.getElementById("add-farm-cnpj").value;
    const license = document.getElementById("add-farm-license").value;
    
    // Exibe o painel de verificação simulado
    document.getElementById("add-farm-fields").style.display = "none";
    document.getElementById("farm-verification-status").style.display = "block";
    
    setTimeout(() => {
      // Cria a fazenda adicional
      const newFarm = {
        id: "farm-" + Date.now(),
        name,
        city: "Município Agro",
        state: stateVal,
        cnpj,
        licenseNumber: license,
        waterOutorga: "OUT-MUN/2026",
        carNumber: "AM-REGISTRO-FEDERAL-CAR",
        sizeHectares: 5.0,
        isVerified: true
      };
      
      state.farms.push(newFarm);
      saveAppState(state);
      
      // Reseta formulário e fecha painel de carregamento
      document.getElementById("form-add-farm").reset();
      document.getElementById("add-farm-fields").style.display = "block";
      document.getElementById("farm-verification-status").style.display = "none";
      
      alert("Verificação concluída! Os dados da fazenda bateram com os registros legais do IBAMA/IPAAM. Acesso concedido!");
      renderMaisFazendasTab();
    }, 2000);
  });
  
  // EVENTOS DO WIDGET FLUTUANTE DA IA IARA
  const iaraAvatar = document.getElementById("iara-avatar");
  const iaraChatbox = document.getElementById("iara-chatbox");
  const closeChatBtn = document.getElementById("close-iara-chat");
  const textInput = document.getElementById("iara-text-input");
  const micBtn = document.getElementById("iara-mic-btn");
  
  // Abre/Fecha Chat
  iaraAvatar.addEventListener("click", () => {
    if (iaraChatbox.style.display === "flex") {
      iaraChatbox.style.display = "none";
    } else {
      iaraChatbox.style.display = "flex";
      // Se não houver mensagens no chat, adiciona uma de boas vindas
      const chatHistory = document.getElementById("iara-chat-history");
      if (chatHistory.children.length === 0) {
        Iara.addChatBubble("iara", "Oi! Eu sou a Iara. Pode falar comigo clicando no botão do microfone verde ou digitar sua dúvida!");
      }
    }
  });
  
  closeChatBtn.addEventListener("click", () => {
    iaraChatbox.style.display = "none";
  });
  
  // Enviar texto no Chat da Iara
  textInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && textInput.value.trim() !== "") {
      const val = textInput.value;
      textInput.value = "";
      Iara.processVoiceCommand(val);
    }
  });
  
  // Clicar no Microfone para falar
  micBtn.addEventListener("click", () => {
    Iara.toggleListen();
  });
  
  // Configura atalhos rápidos de perguntas na IA
  document.querySelectorAll(".btn-quick-ask").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-query");
      Iara.processVoiceCommand(q);
    });
  });

  // Eventos de Sliders de Simulação (Financeiro e Previsão)
  const sliderCount = document.getElementById("slide-fin-fish-count");
  const sliderFeed = document.getElementById("slide-fin-feed-price");
  const sliderSale = document.getElementById("slide-fin-sale-price");
  
  if (sliderCount && sliderFeed && sliderSale) {
    const updateAllSims = () => {
      renderFinanceiroTab();
      renderPrevisaoTab();
    };
    sliderCount.addEventListener("input", updateAllSims);
    sliderFeed.addEventListener("input", updateAllSims);
    sliderSale.addEventListener("input", updateAllSims);
  }
}
