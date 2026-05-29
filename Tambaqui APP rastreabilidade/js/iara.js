// Módulo Assistente de Acessibilidade com IA "Iara"

const Iara = {
  isSpeaking: false,
  isListening: false,
  recognition: null,
  voiceEnabled: true,

  // Inicializa o sintetizador e o reconhecimento de voz do navegador
  init() {
    // Configura o reconhecimento de fala (se disponível)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicUI(true);
      };

      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        this.processVoiceCommand(text);
      };

      this.recognition.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        this.isListening = false;
        this.updateMicUI(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI(false);
      };
    } else {
      console.log("Reconhecimento de fala não suportado neste navegador.");
    }
  },

  // Ativa/Desativa o microfone
  toggleListen() {
    if (!this.recognition) {
      this.speak("Desculpe, a escuta por voz não está disponível no seu navegador. Mas você pode digitar suas perguntas aqui!");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      // Para qualquer fala em andamento antes de escutar
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      
      try {
        this.recognition.start();
      } catch (e) {
        console.error("Erro ao iniciar microfone:", e);
      }
    }
  },

  // Faz a Iara falar o texto
  speak(text) {
    if (!text) return;
    
    // Cancela falas anteriores
    window.speechSynthesis.cancel();

    // Adiciona o texto na tela de chat da Iara
    this.addChatBubble("iara", text);

    if (!this.voiceEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; // Velocidade natural

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateVoiceWaveUI(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateVoiceWaveUI(false);
    };

    utterance.onerror = (e) => {
      console.error("Erro ao reproduzir voz:", e);
      this.isSpeaking = false;
      this.updateVoiceWaveUI(false);
    };

    window.speechSynthesis.speak(utterance);
  },

  // Processa o comando de voz ou texto e retorna a resposta contextual baseada no estado do app
  processVoiceCommand(phrase) {
    // Adiciona a frase digitada/falada pelo produtor no chat
    this.addChatBubble("user", phrase);

    const query = phrase.toLowerCase().trim();
    const state = loadAppState();
    let response = "";

    // 1. Saudações e Apresentação
    if (query.includes("olá") || query.includes("oi") || query.includes("bom dia") || query.includes("boa tarde") || query.includes("quem é você")) {
      response = `Olá! Sou a Iara, sua assistente do Tambaqui da Terra. Estou aqui para ajudar você a cuidar dos seus tanques e peixes para que você tenha o maior lucro possível no fim do lote! Você pode me perguntar quanto dar de ração hoje, como está a água dos tanques ou quando será a colheita dos peixes.`;
    }
    // 2. Recomendação de Ração
    else if (query.includes("ração") || query.includes("alimentar") || query.includes("comer") || query.includes("alimento") || query.includes("comida")) {
      let totalRacao = 0;
      let racaoDetalhada = [];
      let alertaChuva = false;

      state.fishLots.forEach(lot => {
        const tank = state.tanks.find(t => t.id === lot.tankId);
        if (tank) {
          const feedResult = Simulation.calculateFeeding(lot, tank, state.weather.current);
          totalRacao += parseFloat(feedResult.dailyFeedKg);
          racaoDetalhada.push(`${lot.name} (${lot.feedType} no ${tank.name}): dar ${feedResult.dailyFeedKg} kg por dia dividido em ${feedResult.feedingsPerDay} vezes.`);
          if (feedResult.weatherModifier < 1.0) {
            alertaChuva = true;
          }
        }
      });

      response = `Hoje você deve dar no total ${totalRacao.toFixed(1)} kg de ração na fazenda. `;
      response += `Dividido assim: ` + racaoDetalhada.join(" ") + " ";
      if (alertaChuva) {
        response += ` Atenção! Reduzi a quantidade de ração recomendada devido às condições de chuva ou temperatura da água para você economizar ração e evitar desperdício.`;
      } else {
        response += ` O tempo está bom hoje, então alimente no horário padrão com confiança!`;
      }
    }
    // 3. Condições de Clima e Impacto
    else if (query.includes("clima") || query.includes("tempo") || query.includes("chuva") || query.includes("previsão")) {
      const cur = state.weather.current;
      const forecast = state.weather.forecast[1]; // Amanhã ou próximo dia crítico

      response = `Hoje o clima em ${state.farms[0].city} é de ${cur.temp} graus e está ${cur.condition}. A recomendação da IA para hoje é: ${cur.advice}. `;
      response += `E atenção para os próximos dias: para ${forecast.day}, a previsão é ${forecast.condition}. A orientação é: ${forecast.actionAdvice}`;
    }
    // 4. Estado da Água e Tanques (necessidade de limpeza/troca)
    else if (query.includes("água") || query.includes("tanque") || query.includes("limpar") || query.includes("parâmetro") || query.includes("trocar")) {
      let alertasAgua = [];
      let alertasDensidade = [];

      state.tanks.forEach(tank => {
        // Validação da idade da água
        if (tank.waterAgeDays > 10) {
          alertasAgua.push(`A água do ${tank.name} já tem ${tank.waterAgeDays} dias sem troca.`);
        }
        // Parâmetros críticos
        if (tank.parameters.oxygen < 4.0) {
          alertasAgua.push(`O oxigênio no ${tank.name} está crítico em ${tank.parameters.oxygen} mg/L.`);
        }
        if (tank.parameters.ph < 6.5) {
          alertasAgua.push(`O pH do ${tank.name} está um pouco ácido em ${tank.parameters.ph}.`);
        }

        // Densidade
        const tankLots = state.fishLots.filter(l => l.tankId === tank.id);
        const densityData = Simulation.calculateDensity(tank, tankLots);
        if (densityData.warningLevel === "danger" || densityData.warningLevel === "warning") {
          alertasDensidade.push(`${tank.name} está com densidade ${densityData.densityPerM2} peixes por metro quadrado.`);
        }
      });

      if (alertasAgua.length === 0 && alertasDensidade.length === 0) {
        response = `Todos os tanques estão em excelentes condições! A água está limpa e com oxigenação ideal, e a densidade de peixes está perfeita para eles crescerem rápido.`;
      } else {
        response = "Encontrei alguns pontos de atenção nos seus tanques: ";
        if (alertasAgua.length > 0) response += alertasAgua.join(" ") + " ";
        if (alertasDensidade.length > 0) {
          response += "Sobre os peixes: " + alertasDensidade.join(" ") + " Lembre-se que tanques muito cheios fazem o Tambaqui crescer devagar, o que consome mais ração e reduz o seu lucro! Considere transferir alguns peixes.";
        }
      }
    }
    // 5. Despesca / Colheita / Quando Vender
    else if (query.includes("despesca") || query.includes("pescar") || query.includes("colher") || query.includes("vender") || query.includes("pronto") || query.includes("tamanho")) {
      let prontas = [];
      let emCrescimento = [];

      state.fishLots.forEach(lot => {
        const tank = state.tanks.find(t => t.id === lot.tankId);
        const densityData = Simulation.calculateDensity(tank || {area:100, volume:150}, [lot]);
        const prediction = Simulation.predictHarvest(lot, densityData, tank ? tank.parameters : {temp:28, ph:7});

        if (prediction.harvestReady) {
          prontas.push(`O lote ${lot.name} no ${tank ? tank.name : 'tanque'} está pronto para despesca! O peso médio é de ${lot.averageWeight}g.`);
        } else {
          emCrescimento.push(`O lote ${lot.name} está com ${lot.averageWeight}g. Faltam aproximadamente ${prediction.daysRemaining} dias para a despesca, prevista para ${prediction.projectedDate}.`);
        }
      });

      response = "";
      if (prontas.length > 0) response += prontas.join(" ") + " ";
      if (emCrescimento.length > 0) response += "Lotes em crescimento: " + emCrescimento.join(" ") + " ";
      
      // Dica de preço regional
      const bestRegion = state.market.regions.find(r => r.status === "Alta") || state.market.regions[0];
      response += ` Dica de Mercado: O preço do quilo do Tambaqui em ${bestRegion.name} está em alta, cotado a R$ ${bestRegion.price.toFixed(2)}. É uma boa região para programar suas vendas!`;
    }
    // 6. Preço / Margem de Lucro / Finanças / SaaS
    else if (query.includes("preço") || query.includes("lucro") || query.includes("custo") || query.includes("mensalidade") || query.includes("assinatura") || query.includes("financeiro")) {
      response = `Usando as recomendações de engorda da IA (Tambaqui da Terra), o seu Fator de Conversão Alimentar (FCR) melhora de 2.1 para 1.3, gerando uma economia de quase 40% no custo com ração. Para um lote padrão de 1.000 peixes, isso representa cerca de R$ 2.000,00 a menos de gastos com ração e um aumento de mais de 4 vezes no seu lucro líquido!`;
    }
    // 6b. Previsão de Perdas / Sobrevivência / Quantos peixes
    else if (query.includes("previsão") || query.includes("perda") || query.includes("sobreviver") || query.includes("morrer") || query.includes("sobrevivência")) {
      response = `No manejo tradicional empírico, a taxa de perda (mortalidade) de Tambaqui é de cerca de 20%. Seguindo as orientações da IA Iara de densidade e qualidade da água, a taxa de sobrevivência sobe para 94%. Em um lote de 1.000 peixes, você colherá 940 tambaquis em vez de apenas 800, economizando mais de R$ 2.200,00 em perdas financeiras!`;
    }
    // 7. Não Entendido
    else {
      response = `Desculpe, não entendi muito bem. Você pode me perguntar algo mais direto, como: 'Quanto de ração dar hoje?', 'Quando vou poder pescar os peixes?', 'Qual é a previsão de perdas?' ou 'Como está o lucro da fazenda?'`;
    }

    // Executa a voz
    this.speak(response);
  },

  // Cria e anexa as bolhas de bate-papo no container de chat
  addChatBubble(sender, text) {
    const chatContainer = document.getElementById("iara-chat-history");
    if (!chatContainer) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    
    // Formata quebras de linha para exibição visual
    bubble.innerHTML = text.replace(/\n/g, "<br>");
    
    chatContainer.appendChild(bubble);
    
    // Rolagem automática para baixo
    chatContainer.scrollTop = chatContainer.scrollHeight;
  },

  // Métodos auxiliares para interagir com a interface gráfica do chat da Iara
  updateMicUI(active) {
    const micBtn = document.getElementById("iara-mic-btn");
    if (!micBtn) return;
    if (active) {
      micBtn.classList.add("listening");
      micBtn.innerHTML = "🎙️ Escutando...";
    } else {
      micBtn.classList.remove("listening");
      micBtn.innerHTML = "🎙️ Falar com a Iara";
    }
  },

  updateVoiceWaveUI(active) {
    const wave = document.getElementById("iara-voice-wave");
    if (!wave) return;
    if (active) {
      wave.classList.add("active");
    } else {
      wave.classList.remove("active");
    }
  }
};
