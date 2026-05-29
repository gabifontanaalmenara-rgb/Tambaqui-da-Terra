// Módulo de Simulação e Algoritmos de IA para Gestão de Piscicultura

const Simulation = {
  // 1. Cálculo de Densidade e Alertas de Superpopulação
  // Densidade ideal de engorda em tanque escavado semi-intensivo: até 4 peixes por m² (ou 1 peixe por m³ dependendo da vazão)
  calculateDensity(tank, fishLots) {
    const tankLots = fishLots.filter(l => l.tankId === tank.id);
    const totalFish = tankLots.reduce((sum, l) => sum + l.quantity, 0);
    
    const densityPerM2 = totalFish / tank.area;
    const densityPerM3 = totalFish / tank.volume;
    
    // Fator de crescimento com base na densidade
    // Ideal: <= 4 peixes por m². A partir disso, o crescimento cai drasticamente
    let growthFactor = 1.0;
    let status = "Ideal";
    let message = "Densidade ótima para crescimento acelerado.";
    let warningLevel = "success"; // success, warning, danger
    
    if (densityPerM2 > 4 && densityPerM2 <= 6) {
      growthFactor = 0.80; // 20% de redução no crescimento
      status = "Moderada (Atenção)";
      message = "Tanque levemente cheio. A velocidade de crescimento caiu em 20% e a conversão alimentar aumentou.";
      warningLevel = "warning";
    } else if (densityPerM2 > 6) {
      growthFactor = 0.55; // 45% de redução no crescimento!
      status = "Crítica (Superpopulação)";
      message = "Superpopulado! Peixes demoram o DOBRO do tempo para crescer. Risco alto de perdas financeiras e desperdício de ração (mais de 80% do seu custo). Transfira peixes urgentemente!";
      warningLevel = "danger";
    }
    
    return {
      totalFish,
      densityPerM2: densityPerM2.toFixed(2),
      densityPerM3: densityPerM3.toFixed(2),
      growthFactor,
      status,
      message,
      warningLevel
    };
  },

  // 2. Recomendação de Ração Diária Inteligente
  // Calcula o total de ração por dia (dividido em tratos) e o teor proteico necessário
  calculateFeeding(lot, tank, weather) {
    if (!lot || !tank) return null;
    
    const weightG = lot.averageWeight;
    const totalBiomassKg = (lot.quantity * weightG) / 1000;
    
    // Determina a taxa de alimentação teórica (% da biomassa corporal do peixe por dia)
    let feedRatePercent = 1.0;
    let feedType = "Engorda 28% PB";
    
    if (weightG < 50) {
      feedRatePercent = 5.0; // 5% do peso corporal
      feedType = "Inicial Alevinos 40% PB";
    } else if (weightG < 150) {
      feedRatePercent = 3.5;
      feedType = "Inicial 36% PB";
    } else if (weightG < 500) {
      feedRatePercent = 2.5;
      feedType = "Crescimento 32% PB";
    } else if (weightG < 1000) {
      feedRatePercent = 1.8;
      feedType = "Engorda 32% PB";
    } else {
      feedRatePercent = 1.0;
      feedType = "Acabamento 28% PB";
    }

    // Fator clima (temperatura e chuva afetam o metabolismo do Tambaqui)
    let weatherModifier = 1.0;
    let weatherAdvice = "";
    
    const cond = weather.condition.toLowerCase();
    const temp = weather.temp;
    
    // Temperatura ideal do Tambaqui: 26°C a 30°C
    if (temp < 24) {
      weatherModifier *= 0.6; // Come menos no frio
      weatherAdvice += "Água fria reduz o apetite do Tambaqui. ";
    } else if (temp > 32) {
      weatherModifier *= 0.8; // Reduz no calor extremo devido a estresse e menor O2
      weatherAdvice += "Água muito quente reduz o oxigênio e o apetite. Acompanhe a aeração. ";
    }

    if (cond.includes("chuva") || cond.includes("tempestade")) {
      if (cond.includes("forte") || cond.includes("intensa") || cond.includes("tempestade")) {
        weatherModifier *= 0.3; // Corta em 70% a ração para evitar desperdício absoluto
        weatherAdvice += "ALERTA: Chuva forte derruba a oxigenação e impede que o peixe suba para comer. Reduza a ração em 70% para não ir ao fundo e apodrecer a água!";
      } else {
        weatherModifier *= 0.7; // Reduz em 30% nas chuvas normais
        weatherAdvice += "Pancadas de chuva diminuem o consumo. Reduzir em 30% a ração da tarde. ";
      }
    } else {
      weatherAdvice += "Clima favorável para a alimentação normal.";
    }

    // Parâmetros de água afetando a alimentação
    let waterModifier = 1.0;
    if (tank.parameters.oxygen < 3.5) {
      waterModifier *= 0.3;
      weatherAdvice += " [CRÍTICO] Oxigênio abaixo de 3.5 mg/L! Não alimente os peixes agora para evitar mortalidade.";
    } else if (tank.parameters.ph < 6.0 || tank.parameters.ph > 8.2) {
      waterModifier *= 0.8;
      weatherAdvice += " [ATENÇÃO] pH fora da faixa ideal de 6.5 a 7.5. Correção necessária.";
    }

    // Ajusta o Fator de Conversão Alimentar com base na densidade
    const densityData = this.calculateDensity(tank, [lot]);
    const adjustedFcr = lot.fcr * (1 + (1 - densityData.growthFactor) * 0.5); // Aumenta o FCR (gasta mais ração pra crescer o mesmo)

    const finalFeedRate = feedRatePercent * weatherModifier * waterModifier;
    const dailyFeedKg = (totalBiomassKg * (finalFeedRate / 100));
    
    // Sugestão de divisões de refeições (tratos)
    let feedingsPerDay = 3;
    if (weightG > 500) feedingsPerDay = 2; // Adultos comem 2 vezes ao dia
    const feedPerServingKg = dailyFeedKg / feedingsPerDay;

    return {
      recommendedFeedType: feedType,
      baseFeedRatePercent: feedRatePercent,
      weatherModifier: weatherModifier.toFixed(2),
      waterModifier: waterModifier.toFixed(2),
      dailyFeedKg: dailyFeedKg.toFixed(2),
      feedingsPerDay,
      feedPerServingKg: feedPerServingKg.toFixed(2),
      adjustedFcr: adjustedFcr.toFixed(2),
      weatherAdvice
    };
  },

  // 3. Projeção de Crescimento e Previsão de Despesca (Colheita)
  // Estima quantos dias faltam para atingir o peso ideal de comercialização (típico 1.200g a 1.500g)
  predictHarvest(lot, densityData, tankParameters) {
    const currentWeight = lot.averageWeight;
    const targetWeight = 1200; // gramas ideal para venda B2C/B2B de tambaqui
    
    if (currentWeight >= targetWeight) {
      return {
        daysRemaining: 0,
        harvestReady: true,
        projectedDate: "Pronto para Colheita!",
        dailyGrowthRateG: 0,
        advice: "O lote atingiu o peso comercial ideal de 1.2kg! Programe a despesca e venda para garantir a melhor margem de lucro."
      };
    }

    // Taxa de crescimento padrão do Tambaqui de engorda: 7g a 10g por dia sob condições ideais
    let baseGrowthPerDay = 8.5; // g/dia
    
    // Ajusta conforme a densidade
    let growthRate = baseGrowthPerDay * densityData.growthFactor;
    
    // Ajusta conforme a temperatura da água (ideal entre 27 e 30)
    const temp = tankParameters.temp;
    if (temp < 25) {
      growthRate *= 0.7; // Frio reduz metabolismo
    } else if (temp > 31) {
      growthRate *= 0.85; // Calor excessivo estressa o animal
    }
    
    // Ajusta conforme o pH
    const ph = tankParameters.ph;
    if (ph < 6.2 || ph > 7.8) {
      growthRate *= 0.9;
    }

    const weightNeeded = targetWeight - currentWeight;
    const daysRemaining = Math.ceil(weightNeeded / growthRate);
    
    // Calcular a data futura
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysRemaining);
    const dateFormatted = harvestDate.toLocaleDateString('pt-BR');

    let advice = "";
    if (densityData.growthFactor < 0.9) {
      advice = `O superpovoamento do tanque está atrasando a colheita em cerca de ${Math.round(daysRemaining * (1/densityData.growthFactor - 1))} dias. Se você transferir os peixes para dividir a densidade, eles chegarão ao peso de mercado muito mais rápido!`;
    } else {
      advice = "Crescimento excelente. Mantenha os parâmetros da água estáveis e a alimentação regulada para colher conforme o cronograma.";
    }

    return {
      daysRemaining,
      harvestReady: false,
      projectedDate: dateFormatted,
      dailyGrowthRateG: growthRate.toFixed(1),
      advice
    };
  },

  // 4. Simulação Financeira
  // Compara os cenários Empírico (Atual) vs Otimizado (IA) para o período de engorda (8 a 12 meses)
  simulateFinancials(fishCount, feedPrice, salePrice) {
    // Parâmetros do Ciclo de Engorda (8 a 12 meses)
    // Cenário Empírico (Atual)
    const empSurvivalRate = 0.80; // 80% sobrevivência
    const empHarvestWeight = 1.2; // 1.2 kg por peixe
    const empFcr = 2.1; // Conversão alimentar ruim
    
    // Cenário IA (Melhores Condições)
    const iaSurvivalRate = 0.94; // 94% sobrevivência
    const iaHarvestWeight = 1.35; // 1.35 kg por peixe (cresce mais com densidade correta e oxigênio)
    const iaFcr = 1.3; // Conversão alimentar otimizada
    
    // Cálculos Cenário Empírico
    const empHarvestCount = Math.round(fishCount * empSurvivalRate);
    const empTotalBiomass = empHarvestCount * empHarvestWeight;
    const empRevenue = empTotalBiomass * salePrice;
    const empFeedUsed = empTotalBiomass * empFcr;
    const empFeedCost = empFeedUsed * feedPrice;
    const empOtherCosts = fishCount * 1.50; // Alevinos, energia, etc.
    const empProfit = empRevenue - (empFeedCost + empOtherCosts);
    
    // Cálculos Cenário IA (Melhores Condições)
    const iaHarvestCount = Math.round(fishCount * iaSurvivalRate);
    const iaTotalBiomass = iaHarvestCount * iaHarvestWeight;
    const iaRevenue = iaTotalBiomass * salePrice;
    const iaFeedUsed = iaTotalBiomass * iaFcr;
    const iaFeedCost = iaFeedUsed * feedPrice;
    const iaOtherCosts = fishCount * 1.50; // Mesmos custos fixos básicos
    const iaProfit = iaRevenue - (iaFeedCost + iaOtherCosts);
    
    return {
      emp: {
        harvestCount: empHarvestCount,
        biomassKg: empTotalBiomass.toFixed(1),
        revenue: empRevenue.toFixed(2),
        feedUsedKg: empFeedUsed.toFixed(1),
        feedCost: empFeedCost.toFixed(2),
        otherCosts: empOtherCosts.toFixed(2),
        profit: empProfit.toFixed(2),
        fcr: empFcr
      },
      ia: {
        harvestCount: iaHarvestCount,
        biomassKg: iaTotalBiomass.toFixed(1),
        revenue: iaRevenue.toFixed(2),
        feedUsedKg: iaFeedUsed.toFixed(1),
        feedCost: iaFeedCost.toFixed(2),
        otherCosts: iaOtherCosts.toFixed(2),
        profit: iaProfit.toFixed(2),
        fcr: iaFcr
      },
      profitDifference: (iaProfit - empProfit).toFixed(2),
      feedSavedKg: (empFeedUsed - iaFeedUsed).toFixed(1),
      feedSavingsCost: (empFeedCost - iaFeedCost).toFixed(2)
    };
  },

  // 5. Simulação de Perda e Sobrevivência
  simulateSurvival(fishCount, salePrice) {
    const empSurvivalRate = 0.80;
    const iaSurvivalRate = 0.94;
    
    const empHarvestCount = Math.round(fishCount * empSurvivalRate);
    const empLostCount = fishCount - empHarvestCount;
    
    const iaHarvestCount = Math.round(fishCount * iaSurvivalRate);
    const iaLostCount = fishCount - iaHarvestCount;
    
    const fishSaved = empLostCount - iaLostCount; // Quantos peixes a IA salvou da morte
    
    // Perda financeira estimada: peixe perdido que poderia ser vendido a 1.25kg
    const avgWeight = 1.25; 
    const empLostRevenue = empLostCount * avgWeight * salePrice;
    const iaLostRevenue = iaLostCount * avgWeight * salePrice;
    const financialLossDifference = empLostRevenue - iaLostRevenue;
    
    return {
      emp: {
        survived: empHarvestCount,
        lost: empLostCount,
        survivalPercent: 80,
        lostRevenue: empLostRevenue.toFixed(2)
      },
      ia: {
        survived: iaHarvestCount,
        lost: iaLostCount,
        survivalPercent: 94,
        lostRevenue: iaLostRevenue.toFixed(2)
      },
      fishSaved,
      financialLossDifference: financialLossDifference.toFixed(2)
    };
  }
};
