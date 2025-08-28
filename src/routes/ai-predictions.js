// src/routes/ai-predictions.js
// SurfAI V1 - Routes API pour Moteur IA de Prédictions

const express = require('express');
const router = express.Router();

// Import du moteur IA
let AIPersonalizedPredictionEngine;
try {
  AIPersonalizedPredictionEngine = require('../services/AIPersonalizedPredictionEngine');
  console.log('✅ Moteur IA de prédictions importé');
} catch (error) {
  console.log('❌ Erreur import moteur IA:', error.message);
}

// Import des autres services
let EnhancedUserProfileService, SessionQuickEntryService;
try {
  EnhancedUserProfileService = require('../services/EnhancedUserProfileService');
  SessionQuickEntryService = require('../services/SessionQuickEntryService');
} catch (error) {
  console.log('⚠️ Services dépendants non trouvés');
}

// Instances des services
let aiEngine, profileService, sessionService;

if (AIPersonalizedPredictionEngine) {
  aiEngine = new AIPersonalizedPredictionEngine();
  console.log('🤖 Moteur IA initialisé');
}

if (EnhancedUserProfileService) {
  profileService = new EnhancedUserProfileService();
}

if (SessionQuickEntryService) {
  sessionService = new SessionQuickEntryService();
}

// ===== ROUTES MOTEUR IA =====

// GET /test - Test du moteur IA
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Moteur IA de Prédictions SurfAI opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Analyse personnalisée des sessions',
      'Prédictions IA score 0-10',
      'Apprentissage continu des préférences',
      'Recommandations intelligentes',
      'Alternatives géographiques',
      'Insights comportementaux'
    ],
    services: {
      aiEngine: aiEngine ? 'loaded' : 'not_loaded',
      profileService: profileService ? 'loaded' : 'not_loaded',
      sessionService: sessionService ? 'loaded' : 'not_loaded'
    }
  });
});

// POST /analyze/:userId - Analyser les préférences utilisateur
router.post('/analyze/:userId', async (req, res) => {
  try {
    if (!aiEngine) {
      return res.status(500).json({
        status: 'error',
        message: 'Moteur IA non disponible'
      });
    }

    const { userId } = req.params;
    
    // 1. Récupération des sessions utilisateur
    let sessions = [];
    if (sessionService) {
      const userSessions = sessionService.getUserSessions(userId, 50, 0);
      sessions = userSessions.sessions;
    } else {
      // Mock de sessions pour demo
      sessions = req.body.sessions || [];
    }

    if (sessions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucune session trouvée pour cet utilisateur',
        suggestion: 'Enregistrez au moins 3 sessions pour activer l\'IA'
      });
    }

    // 2. Analyse IA des préférences
    const startTime = Date.now();
    const analysis = await aiEngine.analyzeUserPreferences(userId, sessions);
    const processingTime = Date.now() - startTime;

    res.json({
      status: analysis.status,
      message: analysis.message,
      userId: userId,
      sessionsAnalyzed: sessions.length,
      aiProfile: analysis.aiProfile,
      insights: analysis.insights,
      predictions: analysis.predictions,
      meta: {
        processingTime: processingTime,
        algorithm: 'AIPersonalized_v1.0',
        dataQuality: analysis.aiProfile?.dataQuality
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// POST /predict - Prédiction IA pour session spécifique
router.post('/predict', async (req, res) => {
  try {
    if (!aiEngine) {
      return res.status(500).json({
        status: 'error',
        message: 'Moteur IA non disponible'
      });
    }

    const { userId, spotName, targetDateTime, weatherData } = req.body;

    // Validation des données
    if (!userId || !spotName || !targetDateTime) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, spotName et targetDateTime requis'
      });
    }

    // Prédiction IA
    const startTime = Date.now();
    const prediction = await aiEngine.predictSessionQuality(
      userId, 
      spotName, 
      targetDateTime, 
      weatherData
    );
    const processingTime = Date.now() - startTime;

    if (prediction.status === 'no_profile') {
      return res.status(400).json({
        status: 'error',
        message: 'Profil utilisateur non analysé',
        action: 'Utilisez POST /analyze/:userId d\'abord'
      });
    }

    res.json({
      status: 'success',
      message: 'Prédiction IA générée',
      prediction: prediction,
      meta: {
        processingTime: processingTime,
        requestedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /:userId/recommendations - Recommandations intelligentes
router.get('/:userId/recommendations', async (req, res) => {
  try {
    if (!aiEngine) {
      return res.status(500).json({
        status: 'error',
        message: 'Moteur IA non disponible'
      });
    }

    const { userId } = req.params;
    const { lat, lng, days = 7 } = req.query;

    // Validation localisation
    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Coordonnées lat et lng requises'
      });
    }

    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };

    // Génération des recommandations IA
    const startTime = Date.now();
    const recommendations = await aiEngine.generateSmartRecommendations(
      userId, 
      location, 
      parseInt(days)
    );
    const processingTime = Date.now() - startTime;

    if (recommendations.status === 'no_profile') {
      return res.json({
        status: 'warning',
        message: 'Recommandations basiques - profil non analysé',
        recommendations: [],
        action: 'Analysez vos sessions d\'abord avec POST /analyze/:userId'
      });
    }

    res.json({
      status: recommendations.status,
      message: `Recommandations IA générées pour ${days} jours`,
      userId: userId,
      location: location,
      recommendations: recommendations.recommendations,
      summary: {
        totalOpportunities: recommendations.totalOpportunities,
        bestDay: recommendations.recommendations.length > 0 ? 
          recommendations.recommendations[0] : null
      },
      meta: {
        processingTime: processingTime,
        algorithm: 'SmartRecommendations_v1.0'
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// POST /feedback - Apprentissage continu via feedback
router.post('/feedback', async (req, res) => {
  try {
    if (!aiEngine) {
      return res.status(500).json({
        status: 'error',
        message: 'Moteur IA non disponible'
      });
    }

    const { userId, sessionId, actualRating, predictedScore } = req.body;

    if (!userId || !sessionId || actualRating === undefined || predictedScore === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, sessionId, actualRating et predictedScore requis'
      });
    }

    // Mise à jour de l'apprentissage
    const update = await aiEngine.updateWithFeedback(
      userId, 
      sessionId, 
      actualRating, 
      predictedScore
    );

    res.json({
      status: update.status,
      message: 'IA mise à jour avec votre feedback',
      predictionError: update.predictionError,
      newConfidence: update.newConfidence,
      meta: {
        learningImprovement: update.predictionError < 1 ? 'excellent' : 'en_cours'
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /demo/:userId - Démonstration complète IA
router.get('/demo/:userId', async (req, res) => {
  try {
    if (!aiEngine || !sessionService) {
      return res.status(500).json({
        status: 'error',
        message: 'Services nécessaires non disponibles'
      });
    }

    const { userId } = req.params;

    // 1. Création de sessions démo si nécessaire
    const existingSessions = sessionService.getUserSessions(userId, 10, 0);
    
    if (existingSessions.sessions.length < 3) {
      // Création de sessions démo réalistes
      const demoSessions = [
        {
          userId, spotName: 'Biarritz - Grande Plage', rating: 8, duration: 90,
          coordinates: { lat: 43.4832, lng: -1.5586 },
          notes: 'Super session matinale'
        },
        {
          userId, spotName: 'Anglet - Les Cavaliers', rating: 6, duration: 75,
          coordinates: { lat: 43.4951, lng: -1.5240 },
          notes: 'Un peu de monde mais ça passait'
        },
        {
          userId, spotName: 'Biarritz - Grande Plage', rating: 9, duration: 120,
          coordinates: { lat: 43.4832, lng: -1.5586 },
          notes: 'Conditions parfaites ! offshore 10km/h'
        },
        {
          userId, spotName: 'Hendaye', rating: 4, duration: 45,
          coordinates: { lat: 43.3739, lng: -1.7739 },
          notes: 'Trop petit et pas de force'
        },
        {
          userId, spotName: 'Biarritz - Grande Plage', rating: 7, duration: 85,
          coordinates: { lat: 43.4832, lng: -1.5586 },
          notes: 'Bien pour progresser'
        }
      ];

      // Création des sessions
      for (const sessionData of demoSessions) {
        await sessionService.createQuickSession(userId, sessionData);
      }
    }

    // 2. Analyse IA
    const sessions = sessionService.getUserSessions(userId, 50, 0).sessions;
    const analysis = await aiEngine.analyzeUserPreferences(userId, sessions);

    // 3. Prédiction pour demain à Biarritz
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const mockWeather = {
      waveHeight: 1.2,
      windSpeed: 12,
      windDirection: 'E',
      tide: 'mid'
    };

    const prediction = await aiEngine.predictSessionQuality(
      userId,
      'Biarritz - Grande Plage',
      tomorrow.toISOString(),
      mockWeather
    );

    // 4. Recommandations
    const recommendations = await aiEngine.generateSmartRecommendations(
      userId,
      { lat: 43.4832, lng: -1.5586 },
      3
    );

    res.json({
      status: 'demo_success',
      title: 'Démonstration Complète SurfAI',
      userId: userId,
      demo: {
        sessionsCreated: sessions.length,
        aiAnalysis: {
          status: analysis.status,
          dataQuality: analysis.aiProfile?.dataQuality,
          insights: analysis.insights
        },
        prediction: {
          spot: prediction.spot,
          aiScore: prediction.aiScore,
          confidence: prediction.confidence,
          recommendation: prediction.recommendation
        },
        recommendations: {
          totalOpportunities: recommendations.totalOpportunities,
          nextBestDay: recommendations.recommendations?.[0]
        }
      },
      nextSteps: [
        'L\'IA a analysé vos sessions',
        'Score prédit pour demain: ' + prediction.aiScore + '/10',
        'Continuez à enregistrer vos sessions pour améliorer la précision'
      ]
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /insights/:userId - Insights comportementaux
router.get('/insights/:userId', async (req, res) => {
  try {
    if (!aiEngine) {
      return res.status(500).json({
        status: 'error',
        message: 'Moteur IA non disponible'
      });
    }

    const { userId } = req.params;
    
    // Récupération du profil IA s'il existe
    const userProfile = aiEngine.userPreferences.get(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        status: 'no_profile',
        message: 'Profil IA non trouvé',
        action: 'Analysez vos sessions d\'abord'
      });
    }

    res.json({
      status: 'success',
      userId: userId,
      insights: {
        preferences: {
          optimalWaveHeight: userProfile.optimalConditions.waveHeight.optimal?.toFixed(1) + 'm',
          preferredWindSpeed: userProfile.optimalConditions.windSpeed.optimal?.toFixed(0) + ' km/h',
          favoriteSpot: userProfile.spotPreferences?.[0]?.spot,
          bestTimeSlots: userProfile.timePreferences?.bestHours
        },
        performance: {
          dataQuality: (userProfile.dataQuality * 100).toFixed(0) + '%',
          ratingTrend: userProfile.progression.ratingTrend > 0 ? 'amélioration' : 'stable',
          consistency: 'à calculer'
        },
        recommendations: [
          'Surfez tôt le matin pour de meilleures conditions',
          'Votre spot favori offre la meilleure progression',
          'Évitez les conditions venteuses (>20km/h)'
        ]
      },
      lastUpdated: userProfile.lastUpdated
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
