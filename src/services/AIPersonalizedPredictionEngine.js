// src/services/AIPersonalizedPredictionEngine.js
// SurfAI V1 - Moteur IA de Prédictions Personnalisées

class AIPersonalizedPredictionEngine {
  constructor() {
    this.userPreferences = new Map(); // Cache des préférences apprises
    this.weatherPatterns = new Map(); // Patterns météo analysés
    this.spotCharacteristics = new Map(); // Caractéristiques spots
    this.predictionCache = new Map(); // Cache des prédictions
    
    // Initialisation des données de base
    this.initializeSpotCharacteristics();
    this.initializeWeatherPatterns();
  }

  // ===== ANALYSE DES SESSIONS UTILISATEUR =====
  
  async analyzeUserPreferences(userId, sessions) {
    console.log(`🧠 Analyse des préférences utilisateur ${userId}...`);
    
    if (!sessions || sessions.length < 3) {
      return {
        status: 'insufficient_data',
        message: 'Au moins 3 sessions nécessaires pour l\'analyse IA',
        recommendedActions: ['Enregistrer plus de sessions', 'Noter vos sessions']
      };
    }

    // 1. Extraction des patterns de sessions excellentes (rating >= 8)
    const excellentSessions = sessions.filter(s => s.essential?.rating >= 8);
    const goodSessions = sessions.filter(s => s.essential?.rating >= 6 && s.essential?.rating < 8);
    const badSessions = sessions.filter(s => s.essential?.rating < 6);

    // 2. Analyse des conditions optimales
    const optimalConditions = this.extractOptimalConditions(excellentSessions);
    const goodConditions = this.extractOptimalConditions(goodSessions);
    const avoidConditions = this.extractOptimalConditions(badSessions);

    // 3. Analyse des spots préférés
    const spotPreferences = this.analyzeSpotPreferences(sessions);

    // 4. Analyse temporelle (heure, jour, saison)
    const timePreferences = this.analyzeTimePreferences(sessions);

    // 5. Construction du profil IA
    const aiProfile = {
      userId: userId,
      lastUpdated: new Date().toISOString(),
      dataQuality: this.assessDataQuality(sessions),
      
      // CONDITIONS OPTIMALES APPRISES
      optimalConditions: {
        waveHeight: {
          min: this.getStatistic(excellentSessions, 'autoCompleted.weather.waveHeight', 'min'),
          max: this.getStatistic(excellentSessions, 'autoCompleted.weather.waveHeight', 'max'),
          optimal: this.getStatistic(excellentSessions, 'autoCompleted.weather.waveHeight', 'avg'),
          confidence: excellentSessions.length / sessions.length
        },
        windSpeed: {
          max: this.getStatistic(excellentSessions, 'autoCompleted.weather.windSpeed', 'max'),
          optimal: this.getStatistic(excellentSessions, 'autoCompleted.weather.windSpeed', 'avg'),
          confidence: excellentSessions.length / sessions.length
        },
        windDirection: {
          preferred: this.getMostFrequent(excellentSessions, 'autoCompleted.weather.windDirection'),
          avoided: this.getMostFrequent(badSessions, 'autoCompleted.weather.windDirection')
        },
        tide: {
          preferred: this.getMostFrequent(excellentSessions, 'autoCompleted.weather.tide')
        }
      },

      // PATTERNS TEMPORELS
      timePreferences: timePreferences,

      // SPOTS FAVORIS AVEC RAISONS
      spotPreferences: spotPreferences,

      // ÉVOLUTIONS ET TENDANCES
      progression: {
        ratingTrend: this.calculateRatingTrend(sessions),
        improvementAreas: this.identifyImprovementAreas(sessions),
        nextLevelRequirements: this.getNextLevelRequirements(sessions)
      },

      // FACTEURS D'INFLUENCE
      influenceFactors: {
        weather: this.calculateWeatherInfluence(sessions),
        spot: this.calculateSpotInfluence(sessions),
        time: this.calculateTimeInfluence(sessions),
        equipment: this.calculateEquipmentInfluence(sessions)
      }
    };

    // 6. Sauvegarde du profil IA
    this.userPreferences.set(userId, aiProfile);

    return {
      status: 'success',
      message: `Profil IA analysé avec ${sessions.length} sessions`,
      aiProfile: aiProfile,
      insights: this.generateInsights(aiProfile),
      predictions: await this.generatePredictionsForUser(userId, aiProfile)
    };
  }

  // ===== PRÉDICTIONS PERSONNALISÉES =====
  
  async predictSessionQuality(userId, spotName, targetDateTime, weatherData) {
    console.log(`🎯 Prédiction pour ${userId} - ${spotName} - ${targetDateTime}`);
    
    // 1. Récupération du profil IA utilisateur
    const userProfile = this.userPreferences.get(userId);
    if (!userProfile) {
      return {
        status: 'no_profile',
        message: 'Profil utilisateur non analysé',
        confidence: 0
      };
    }

    // 2. Analyse des conditions prévues
    const conditionScore = this.scoreConditions(weatherData, userProfile.optimalConditions);

    // 3. Analyse du spot
    const spotScore = this.scoreSpot(spotName, userProfile.spotPreferences);

    // 4. Analyse temporelle
    const timeScore = this.scoreTime(targetDateTime, userProfile.timePreferences);

    // 5. Calcul du score global personnalisé
    const globalScore = this.calculateGlobalScore({
      conditions: conditionScore,
      spot: spotScore,
      time: timeScore
    }, userProfile.influenceFactors);

    // 6. Génération de la prédiction
    const prediction = {
      userId: userId,
      spot: spotName,
      targetDateTime: targetDateTime,
      
      // SCORE IA PERSONNALISÉ
      aiScore: Math.round(globalScore * 10) / 10, // 0-10
      confidence: userProfile.dataQuality * 100, // 0-100%
      
      // DÉTAIL DES SCORES
      breakdown: {
        conditions: Math.round(conditionScore * 10) / 10,
        spot: Math.round(spotScore * 10) / 10,
        time: Math.round(timeScore * 10) / 10
      },
      
      // RECOMMANDATIONS IA
      recommendation: this.generateRecommendation(globalScore),
      reasons: this.explainPrediction(conditionScore, spotScore, timeScore, userProfile),
      
      // ALTERNATIVES INTELLIGENTES
      alternatives: await this.findAlternatives(userId, targetDateTime, weatherData),
      
      // MÉTADONNÉES
      generatedAt: new Date().toISOString(),
      algorithm: 'AIPersonalized_v1.0',
      dataPoints: userProfile.spotPreferences?.length || 0
    };

    // 7. Cache de la prédiction
    const cacheKey = `${userId}_${spotName}_${targetDateTime}`;
    this.predictionCache.set(cacheKey, prediction);

    return prediction;
  }

  // ===== RECOMMANDATIONS INTELLIGENTES =====
  
  async generateSmartRecommendations(userId, location, days = 7) {
    const userProfile = this.userPreferences.get(userId);
    if (!userProfile) {
      return { status: 'no_profile', recommendations: [] };
    }

    const recommendations = [];
    const now = new Date();

    // Génération des recommandations pour les prochains jours
    for (let day = 0; day < days; day++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + day);

      // Analyse des créneaux optimaux dans la journée
      const dailySlots = await this.analyzeDailySlots(userId, targetDate, location);
      
      if (dailySlots.length > 0) {
        recommendations.push({
          date: targetDate.toISOString().split('T')[0],
          bestSlots: dailySlots.slice(0, 3), // Top 3 créneaux
          summary: this.summarizeDay(dailySlots)
        });
      }
    }

    return {
      status: 'success',
      userId: userId,
      location: location,
      period: `${days} prochains jours`,
      recommendations: recommendations,
      totalOpportunities: recommendations.reduce((sum, day) => sum + day.bestSlots.length, 0),
      generatedAt: new Date().toISOString()
    };
  }

  // ===== APPRENTISSAGE CONTINU =====
  
  async updateWithFeedback(userId, sessionId, actualRating, predictedScore) {
    console.log(`🔄 Mise à jour apprentissage: session ${sessionId}`);
    
    const userProfile = this.userPreferences.get(userId);
    if (!userProfile) return;

    // 1. Calcul de l'erreur de prédiction
    const predictionError = Math.abs(actualRating - predictedScore);
    
    // 2. Ajustement des poids selon l'erreur
    if (predictionError > 2) {
      // Grande erreur : ajustement significatif
      this.adjustModelWeights(userProfile, 0.1);
    } else if (predictionError > 1) {
      // Erreur modérée : ajustement léger
      this.adjustModelWeights(userProfile, 0.05);
    }
    
    // 3. Mise à jour de la qualité des données
    userProfile.dataQuality = this.recalculateDataQuality(userProfile, predictionError);
    
    // 4. Sauvegarde des améliorations
    this.userPreferences.set(userId, userProfile);

    return {
      status: 'updated',
      predictionError: predictionError,
      newConfidence: userProfile.dataQuality * 100
    };
  }

  // ===== MÉTHODES UTILITAIRES D'ANALYSE =====

  identifyImprovementAreas(sessions) {
  const areas = [];
  
  if (sessions.length < 5) {
    areas.push('Surfer plus régulièrement');
    return areas;
  }
  
  // Analyse des ratings par conditions
  const lowRatingSessions = sessions.filter(s => s.essential?.rating < 6);
  
  if (lowRatingSessions.length > sessions.length * 0.3) {
    areas.push('Choisir de meilleures conditions');
  }
  
  // Analyse de la régularité
  const sessionDates = sessions.map(s => new Date(s.essential?.date));
  const daysBetween = sessionDates.length > 1 ? 
    (Math.max(...sessionDates) - Math.min(...sessionDates)) / (1000 * 60 * 60 * 24) : 0;
  
  if (daysBetween > sessions.length * 14) {
    areas.push('Surfer plus régulièrement');
  }
  
  // Analyse de la variété des spots
  const uniqueSpots = new Set(sessions.map(s => s.essential?.spot)).size;
  if (uniqueSpots < 2 && sessions.length > 5) {
    areas.push('Explorer de nouveaux spots');
  }
  
  return areas.length > 0 ? areas : ['Continuer sur cette lancée !'];
}

getNextLevelRequirements(sessions) {
  const avgRating = sessions.length > 0 ? 
    sessions.reduce((sum, s) => sum + (s.essential?.rating || 0), 0) / sessions.length : 0;
  
  const requirements = [];
  
  if (avgRating < 5) {
    requirements.push('Choisir des conditions plus faciles');
    requirements.push('Surfer plus régulièrement');
  } else if (avgRating < 7) {
    requirements.push('Explorer différents types de vagues');
    requirements.push('Analyser les conditions optimales');
  } else if (avgRating < 8.5) {
    requirements.push('Défier des conditions plus techniques');
    requirements.push('Partager vos spots favoris');
  } else {
    requirements.push('Vous êtes expert ! Aidez les autres');
  }
  
  return requirements;
}

calculateWeatherInfluence(sessions) {
  // Calcule l'influence des conditions météo sur les ratings
  let totalInfluence = 0;
  let validSessions = 0;
  
  sessions.forEach(session => {
    const weather = session.autoCompleted?.weather;
    const rating = session.essential?.rating;
    
    if (weather && rating) {
      // Influence basée sur la corrélation rating/météo
      const waveScore = weather.waveHeight ? Math.min(10, weather.waveHeight * 5) : 5;
      const windScore = weather.windSpeed ? Math.max(0, 10 - weather.windSpeed / 3) : 5;
      const weatherScore = (waveScore + windScore) / 2;
      
      const correlation = Math.abs(rating - weatherScore) < 2 ? 0.8 : 0.3;
      totalInfluence += correlation;
      validSessions++;
    }
  });
  
  return validSessions > 0 ? totalInfluence / validSessions : 0.5;
}

calculateSpotInfluence(sessions) {
  // Calcule l'influence du spot sur les ratings
  const spotRatings = {};
  
  sessions.forEach(session => {
    const spot = session.essential?.spot;
    const rating = session.essential?.rating;
    
    if (spot && rating) {
      if (!spotRatings[spot]) {
        spotRatings[spot] = [];
      }
      spotRatings[spot].push(rating);
    }
  });
  
  // Variance des ratings par spot
  let totalVariance = 0;
  let spotCount = 0;
  
  Object.values(spotRatings).forEach(ratings => {
    if (ratings.length > 1) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
      totalVariance += variance;
      spotCount++;
    }
  });
  
  // Plus la variance est faible, plus l'influence du spot est importante
  const avgVariance = spotCount > 0 ? totalVariance / spotCount : 5;
  return Math.max(0.1, Math.min(0.9, 1 - avgVariance / 10));
}

calculateTimeInfluence(sessions) {
  // Calcule l'influence du timing sur les ratings
  const hourRatings = {};
  
  sessions.forEach(session => {
    const date = new Date(session.essential?.date);
    const hour = date.getHours();
    const rating = session.essential?.rating;
    
    if (rating) {
      if (!hourRatings[hour]) {
        hourRatings[hour] = [];
      }
      hourRatings[hour].push(rating);
    }
  });
  
  // Variance des ratings par heure
  let totalVariance = 0;
  let hourCount = 0;
  
  Object.values(hourRatings).forEach(ratings => {
    if (ratings.length > 1) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
      totalVariance += variance;
      hourCount++;
    }
  });
  
  const avgVariance = hourCount > 0 ? totalVariance / hourCount : 5;
  return Math.max(0.05, Math.min(0.3, 1 - avgVariance / 15)); // Influence plus faible pour le timing
}

calculateEquipmentInfluence(sessions) {
  // Influence de l'équipement (à développer quand on aura les données)
  // Pour l'instant, influence faible par défaut
  return 0.1;
}

adjustModelWeights(userProfile, learningRate) {
  // Ajustement des poids du modèle selon l'erreur de prédiction
  const factors = userProfile.influenceFactors;
  
  // Ajustement conservateur
  factors.weather = Math.max(0.2, Math.min(0.8, factors.weather + (Math.random() - 0.5) * learningRate));
  factors.spot = Math.max(0.1, Math.min(0.6, factors.spot + (Math.random() - 0.5) * learningRate));
  factors.time = Math.max(0.05, Math.min(0.3, factors.time + (Math.random() - 0.5) * learningRate));
  factors.equipment = Math.max(0.05, Math.min(0.2, factors.equipment + (Math.random() - 0.5) * learningRate));
  
  // Normalisation pour que la somme fasse 1
  const total = factors.weather + factors.spot + factors.time + factors.equipment;
  factors.weather /= total;
  factors.spot /= total;
  factors.time /= total;
  factors.equipment /= total;
}

recalculateDataQuality(userProfile, predictionError) {
  // Recalcul de la qualité des données après feedback
  let quality = userProfile.dataQuality;
  
  if (predictionError < 1) {
    quality += 0.02; // Amélioration légère
  } else if (predictionError > 2) {
    quality -= 0.05; // Dégradation
  }
  
  return Math.max(0.1, Math.min(1.0, quality));
}

async analyzeDailySlots(userId, targetDate, location) {
  // Analyse des créneaux optimaux dans une journée
  const slots = [];
  const userProfile = this.userPreferences.get(userId);
  
  if (!userProfile) return slots;
  
  // Créneaux de 3h dans la journée
  const timeSlots = [6, 9, 12, 15, 18];
  
  for (const hour of timeSlots) {
    const slotDate = new Date(targetDate);
    slotDate.setHours(hour, 0, 0, 0);
    
    // Mock météo pour le créneau
    const mockWeather = {
      waveHeight: 1.0 + Math.random(),
      windSpeed: 5 + Math.random() * 15,
      windDirection: ['E', 'SE', 'NE'][Math.floor(Math.random() * 3)],
      tide: ['low', 'mid', 'high'][Math.floor(Math.random() * 3)]
    };
    
    // Prédiction pour ce créneau
    const prediction = await this.predictSessionQuality(
      userId,
      'Biarritz - Grande Plage', // Spot par défaut
      slotDate.toISOString(),
      mockWeather
    );
    
    if (prediction.aiScore >= 6) {
      slots.push({
        hour: hour,
        time: `${hour}h00`,
        score: prediction.aiScore,
        confidence: prediction.confidence,
        conditions: mockWeather,
        recommendation: prediction.recommendation
      });
    }
  }
  
  return slots.sort((a, b) => b.score - a.score);
}

summarizeDay(dailySlots) {
  if (dailySlots.length === 0) return 'Aucun créneau favorable';
  
  const bestSlot = dailySlots[0];
  const avgScore = dailySlots.reduce((sum, slot) => sum + slot.score, 0) / dailySlots.length;
  
  return `Meilleur créneau: ${bestSlot.time} (${bestSlot.score.toFixed(1)}/10)`;
}

async findAlternatives(userId, targetDateTime, weatherData) {
  // Trouve des alternatives géographiques
  const alternatives = [];
  const alternativeSpots = ['Anglet - Les Cavaliers', 'Hendaye', 'Lacanau Océan'];
  
  for (const spot of alternativeSpots) {
    const prediction = await this.predictSessionQuality(userId, spot, targetDateTime, weatherData);
    if (prediction.status !== 'no_profile' && prediction.aiScore >= 6) {
      alternatives.push({
        spot: spot,
        score: prediction.aiScore,
        reason: prediction.recommendation,
        distance: Math.floor(Math.random() * 30) + 5 + 'km' // Mock distance
      });
    }
  }
  
  return alternatives.sort((a, b) => b.score - a.score).slice(0, 2);
}
  
  extractOptimalConditions(sessions) {
    if (!sessions || sessions.length === 0) return null;

    return {
      averageWaveHeight: this.getStatistic(sessions, 'autoCompleted.weather.waveHeight', 'avg'),
      averageWindSpeed: this.getStatistic(sessions, 'autoCompleted.weather.windSpeed', 'avg'),
      preferredWindDirection: this.getMostFrequent(sessions, 'autoCompleted.weather.windDirection'),
      preferredTide: this.getMostFrequent(sessions, 'autoCompleted.weather.tide'),
      sessionCount: sessions.length
    };
  }

  analyzeSpotPreferences(sessions) {
    const spotStats = {};
    
    sessions.forEach(session => {
      const spot = session.essential?.spot;
      if (!spot) return;
      
      if (!spotStats[spot]) {
        spotStats[spot] = {
          sessions: 0,
          totalRating: 0,
          ratings: []
        };
      }
      
      spotStats[spot].sessions++;
      spotStats[spot].totalRating += session.essential.rating;
      spotStats[spot].ratings.push(session.essential.rating);
    });

    return Object.entries(spotStats).map(([spot, stats]) => ({
      spot: spot,
      sessions: stats.sessions,
      averageRating: stats.totalRating / stats.sessions,
      preference: stats.sessions / sessions.length,
      consistency: this.calculateConsistency(stats.ratings)
    })).sort((a, b) => b.preference - a.preference);
  }

  analyzeTimePreferences(sessions) {
    const timeStats = {
      hourPreferences: {},
      dayPreferences: {},
      monthPreferences: {}
    };

    sessions.forEach(session => {
      const date = new Date(session.essential.date);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = dimanche
      const month = date.getMonth();

      // Analyse par heure
      if (!timeStats.hourPreferences[hour]) {
        timeStats.hourPreferences[hour] = { count: 0, totalRating: 0 };
      }
      timeStats.hourPreferences[hour].count++;
      timeStats.hourPreferences[hour].totalRating += session.essential.rating;

      // Analyse par jour
      if (!timeStats.dayPreferences[day]) {
        timeStats.dayPreferences[day] = { count: 0, totalRating: 0 };
      }
      timeStats.dayPreferences[day].count++;
      timeStats.dayPreferences[day].totalRating += session.essential.rating;

      // Analyse par mois
      if (!timeStats.monthPreferences[month]) {
        timeStats.monthPreferences[month] = { count: 0, totalRating: 0 };
      }
      timeStats.monthPreferences[month].count++;
      timeStats.monthPreferences[month].totalRating += session.essential.rating;
    });

    return {
      bestHours: this.getBestTimeSlots(timeStats.hourPreferences),
      bestDays: this.getBestTimeSlots(timeStats.dayPreferences),
      bestMonths: this.getBestTimeSlots(timeStats.monthPreferences)
    };
  }

  // ===== SCORING ET CALCULS =====
  
  scoreConditions(weather, optimalConditions) {
    let score = 5.0; // Base score

    // Score vagues
    if (optimalConditions.waveHeight && weather.waveHeight) {
      const waveOptimal = optimalConditions.waveHeight.optimal;
      const waveActual = weather.waveHeight;
      const waveDiff = Math.abs(waveActual - waveOptimal) / waveOptimal;
      const waveScore = Math.max(0, 1 - waveDiff);
      score *= (0.4 * waveScore + 0.6); // 40% influence vagues
    }

    // Score vent
    if (optimalConditions.windSpeed && weather.windSpeed) {
      const windOptimal = optimalConditions.windSpeed.optimal;
      const windActual = weather.windSpeed;
      const windScore = windActual <= windOptimal ? 1.0 : Math.max(0, 1 - (windActual - windOptimal) / windOptimal);
      score *= (0.3 * windScore + 0.7); // 30% influence vent
    }

    // Direction vent
    if (optimalConditions.windDirection && weather.windDirection) {
      const directionMatch = optimalConditions.windDirection.preferred === weather.windDirection ? 1.0 : 0.7;
      score *= (0.2 * directionMatch + 0.8); // 20% influence direction
    }

    return Math.min(10, Math.max(0, score));
  }

  scoreSpot(spotName, spotPreferences) {
    if (!spotPreferences) return 5.0;
    
    const spotPref = spotPreferences.find(sp => sp.spot === spotName);
    if (!spotPref) return 5.0; // Spot neutre
    
    return spotPref.averageRating;
  }

  scoreTime(targetDateTime, timePreferences) {
    const date = new Date(targetDateTime);
    const hour = date.getHours();
    const day = date.getDay();
    
    let score = 5.0;
    
    if (timePreferences.bestHours && timePreferences.bestHours[hour]) {
      score = timePreferences.bestHours[hour];
    }
    
    return score;
  }

  calculateGlobalScore(scores, influenceFactors) {
    const weights = {
      conditions: influenceFactors?.weather || 0.5,
      spot: influenceFactors?.spot || 0.3,
      time: influenceFactors?.time || 0.2
    };

    return (
      scores.conditions * weights.conditions +
      scores.spot * weights.spot +
      scores.time * weights.time
    );
  }

  // ===== GÉNÉRATION INSIGHTS & RECOMMANDATIONS =====
  
  generateRecommendation(score) {
    if (score >= 8.5) return 'EXCELLENT - Session parfaite prédite !';
    if (score >= 7.0) return 'TRÈS BON - Conditions favorables';
    if (score >= 6.0) return 'BON - Session intéressante';
    if (score >= 4.0) return 'MOYEN - Conditions correctes';
    return 'ÉVITER - Conditions défavorables';
  }

  explainPrediction(conditionScore, spotScore, timeScore, userProfile) {
    const reasons = [];
    
    if (conditionScore >= 7) reasons.push('✅ Conditions météo optimales pour vous');
    else if (conditionScore <= 4) reasons.push('❌ Conditions météo défavorables');
    
    if (spotScore >= 7) reasons.push('✅ Spot dans vos favoris');
    else if (spotScore <= 4) reasons.push('⚠️ Spot peu familier');
    
    if (timeScore >= 7) reasons.push('✅ Heure favorable selon votre historique');
    
    return reasons.length > 0 ? reasons : ['📊 Prédiction basée sur vos données personnelles'];
  }

  generateInsights(aiProfile) {
    const insights = [];
    
    // Insights sur conditions préférées
    if (aiProfile.optimalConditions.waveHeight.optimal) {
      insights.push(`🌊 Vous préférez les vagues de ${aiProfile.optimalConditions.waveHeight.optimal.toFixed(1)}m`);
    }
    
    if (aiProfile.optimalConditions.windSpeed.optimal < 15) {
      insights.push(`💨 Vous surfez mieux avec peu de vent (${aiProfile.optimalConditions.windSpeed.optimal.toFixed(0)} km/h max)`);
    }
    
    // Insights sur spots
    if (aiProfile.spotPreferences && aiProfile.spotPreferences.length > 0) {
      const bestSpot = aiProfile.spotPreferences[0];
      insights.push(`📍 Votre spot favori: ${bestSpot.spot} (${bestSpot.averageRating.toFixed(1)}/10)`);
    }
    
    // Insights progression
    if (aiProfile.progression.ratingTrend > 0.2) {
      insights.push(`📈 Vos sessions s'améliorent ! Tendance: +${aiProfile.progression.ratingTrend.toFixed(1)}`);
    }
    
    return insights;
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  getStatistic(sessions, path, type) {
    const values = sessions
      .map(session => this.getNestedProperty(session, path))
      .filter(val => val !== undefined && val !== null);
    
    if (values.length === 0) return null;
    
    switch (type) {
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return values[0];
    }
  }

  getMostFrequent(sessions, path) {
    const values = sessions
      .map(session => this.getNestedProperty(session, path))
      .filter(val => val !== undefined && val !== null);
    
    if (values.length === 0) return null;
    
    const frequency = {};
    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
    
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  calculateConsistency(ratings) {
    if (ratings.length < 2) return 1;
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
    return Math.max(0, 1 - variance / 10); // Normalisation 0-1
  }

  calculateRatingTrend(sessions) {
    if (sessions.length < 3) return 0;
    
    const sortedSessions = sessions.sort((a, b) => new Date(a.essential.date) - new Date(b.essential.date));
    const firstHalf = sortedSessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.essential.rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.essential.rating, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  assessDataQuality(sessions) {
    let quality = 0.5; // Base
    
    // Plus de sessions = meilleure qualité
    if (sessions.length >= 10) quality += 0.3;
    else if (sessions.length >= 5) quality += 0.2;
    else if (sessions.length >= 3) quality += 0.1;
    
    // Variété des spots
    const uniqueSpots = new Set(sessions.map(s => s.essential?.spot)).size;
    if (uniqueSpots >= 3) quality += 0.1;
    
    // Données météo complètes
    const withWeather = sessions.filter(s => s.autoCompleted?.weather).length;
    quality += 0.1 * (withWeather / sessions.length);
    
    return Math.min(1, quality);
  }

  initializeSpotCharacteristics() {
    // Base de données des caractéristiques des spots
    const spots = [
      { name: 'Biarritz - Grande Plage', difficulty: 'beginner', exposure: 'protected', bestTide: 'mid' },
      { name: 'Hossegor - La Nord', difficulty: 'advanced', exposure: 'open', bestTide: 'low' },
      { name: 'Anglet - Les Cavaliers', difficulty: 'intermediate', exposure: 'semi-protected', bestTide: 'high' }
    ];
    
    spots.forEach(spot => {
      this.spotCharacteristics.set(spot.name, spot);
    });
  }

  initializeWeatherPatterns() {
    // Patterns météo de base pour la région
    this.weatherPatterns.set('Atlantic_Coast_France', {
      bestWindDirection: ['E', 'SE', 'NE'],
      optimalWindSpeed: 15,
      seasonalPatterns: {
        summer: { waveHeight: [0.8, 1.5], windSpeed: [5, 15] },
        winter: { waveHeight: [1.2, 2.5], windSpeed: [10, 25] }
      }
    });
  }

  getBestTimeSlots(timeData) {
    return Object.entries(timeData)
      .map(([time, stats]) => ({
        time: parseInt(time),
        averageRating: stats.totalRating / stats.count,
        frequency: stats.count
      }))
      .filter(slot => slot.frequency >= 2) // Au moins 2 sessions
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 3);
  }
}

module.exports = AIPersonalizedPredictionEngine;
