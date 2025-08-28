const express = require('express');
const router = express.Router();

// Import du moteur IA
let AIPersonalizedPredictionEngine;
try {
  AIPersonalizedPredictionEngine = require('../services/AIPersonalizedPredictionEngine');
  console.log('✅ Moteur IA importé');
} catch (error) {
  console.log('❌ Erreur import moteur IA:', error.message);
}

// Instance du moteur IA
let aiEngine;
if (AIPersonalizedPredictionEngine) {
  try {
    aiEngine = new AIPersonalizedPredictionEngine();
    console.log('✅ Moteur IA initialisé');
  } catch (error) {
    console.log('❌ Erreur initialisation moteur IA:', error.message);
  }
}

router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test diagnostic moteur IA',
    timestamp: new Date().toISOString(),
    services: {
      aiEngine: aiEngine ? 'loaded' : 'not_loaded',
      importSuccess: !!AIPersonalizedPredictionEngine,
      instanceSuccess: !!aiEngine
    }
  });
});

router.get('/demo/:userId', async (req, res) => {
  if (!aiEngine) {
    return res.status(500).json({
      status: 'error',
      message: 'Moteur IA non disponible'
    });
  }

  try {
    const demoSessions = [
      {
        essential: { spot: 'Biarritz - Grande Plage', rating: 8, date: new Date(Date.now() - 86400000 * 5).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.2, windSpeed: 10, windDirection: 'E', tide: 'mid' } }
      },
      {
        essential: { spot: 'Anglet - Les Cavaliers', rating: 6, date: new Date(Date.now() - 86400000 * 3).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.5, windSpeed: 18, windDirection: 'NE', tide: 'high' } }
      },
      {
        essential: { spot: 'Biarritz - Grande Plage', rating: 9, date: new Date(Date.now() - 86400000 * 1).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.1, windSpeed: 8, windDirection: 'E', tide: 'low' } }
      },
      {
        essential: { spot: 'Hendaye', rating: 4, date: new Date(Date.now() - 86400000 * 7).toISOString() },
        autoCompleted: { weather: { waveHeight: 0.6, windSpeed: 22, windDirection: 'W', tide: 'high' } }
      }
    ];

    const analysis = await aiEngine.analyzeUserPreferences(req.params.userId, demoSessions);
    
    res.json({
      status: 'success',
      message: 'Démo IA avec analyse complète',
      userId: req.params.userId,
      sessionsAnalyzed: demoSessions.length,
      analysis: analysis
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// NOUVELLE ROUTE POUR TESTER L'ÉTAPE 2
router.post('/predict/test', async (req, res) => {
  if (!aiEngine) {
    return res.status(500).json({
      status: 'error',
      message: 'Moteur IA non disponible'
    });
  }

  try {
    // 1. Sessions de démo pour apprentissage
    const demoSessions = [
      {
        essential: { spot: 'Biarritz - Grande Plage', rating: 8, date: new Date(Date.now() - 86400000 * 5).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.2, windSpeed: 10, windDirection: 'E', tide: 'mid' } }
      },
      {
        essential: { spot: 'Anglet - Les Cavaliers', rating: 6, date: new Date(Date.now() - 86400000 * 3).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.5, windSpeed: 18, windDirection: 'NE', tide: 'high' } }
      },
      {
        essential: { spot: 'Biarritz - Grande Plage', rating: 9, date: new Date(Date.now() - 86400000 * 1).toISOString() },
        autoCompleted: { weather: { waveHeight: 1.1, windSpeed: 8, windDirection: 'E', tide: 'low' } }
      }
    ];

    console.log('🧠 Apprentissage des préférences...');
    await aiEngine.analyzeUserPreferences('test_user_scoring', demoSessions);

    console.log('🎯 Test prédiction personnalisée...');
    
    // 2. Test avec conditions optimales (similaires aux préférences)
    const predictionOptimal = await aiEngine.predictSessionQuality(
      'test_user_scoring',
      'Biarritz - Grande Plage',
      new Date().toISOString(),
      { waveHeight: 1.1, windSpeed: 9, windDirection: 'E' }
    );

    // 3. Test avec conditions différentes
    const predictionDifferent = await aiEngine.predictSessionQuality(
      'test_user_scoring',
      'Hendaye',
      new Date().toISOString(),
      { waveHeight: 2.5, windSpeed: 25, windDirection: 'W' }
    );

    res.json({
      status: 'success',
      message: '🧪 Test Étape 2 : Scoring Personnalisé',
      etape: 2,
      tests: {
        conditionsOptimales: predictionOptimal,
        conditionsDifferentes: predictionDifferent
      },
      validation: {
        scoreOptimal: predictionOptimal.aiScore,
        scoreDifferent: predictionDifferent.aiScore,
        difference: Math.round((predictionOptimal.aiScore - predictionDifferent.aiScore) * 10) / 10,
        personnalise: {
          optimal: predictionOptimal.personalized,
          different: predictionDifferent.personalized
        },
        recommandations: {
          optimal: predictionOptimal.recommendation,
          different: predictionDifferent.recommendation
        }
      },
      success: predictionOptimal.personalized && predictionDifferent.personalized
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      etape: 2
    });
  }
});

// TEST STORMGLASS INTÉGRATION COMPLÈTE
router.post('/session/test-stormglass', async (req, res) => {
  try {
    // Import des nouveaux services
    const EnhancedSessionService = require('../services/EnhancedSessionService');
    const sessionService = new EnhancedSessionService();

    console.log('🌊 Test création session avec Stormglass...');

    // 1. Test création session enrichie automatiquement
    const sessionData = {
      spotName: 'Biarritz - Grande Plage',
      sessionDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
      rating: 8,
      duration: 90,
      notes: 'Test session enrichie Stormglass'
    };

    const sessionResult = await sessionService.createEnhancedSession('test_stormglass', sessionData);

    if (!sessionResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Échec création session enrichie',
        error: sessionResult.error
      });
    }

    // 2. Récupération des sessions utilisateur
    const userSessions = sessionService.getUserSessions('test_stormglass');
    
    // 3. Analyse qualité des données
    const qualityAnalysis = sessionService.analyzeSessionDataQuality('test_stormglass');

    // 4. Test avec le moteur IA sur données complètes
    let aiAnalysis = null;
    if (aiEngine && userSessions.length > 0) {
      console.log('🧠 Test IA avec données Stormglass complètes...');
      
      // Conversion au format attendu par l'IA
      const sessionsForAI = userSessions.map(session => ({
        essential: session.essential,
        autoCompleted: {
          weather: {
            waveHeight: session.conditions.waveHeight,
            wavePeriod: session.conditions.wavePeriod,          // NOUVEAU
            waveDirection: session.conditions.waveDirection,    // NOUVEAU
            windSpeed: session.conditions.windSpeed,
            windDirection: session.conditions.windDirection,
            tideLevel: session.conditions.tideLevel,           // NOUVEAU
            tideDirection: session.conditions.tideDirection,   // NOUVEAU
            tideCoefficient: session.conditions.tideCoefficient, // NOUVEAU
            tidePhase: session.conditions.tidePhase,           // NOUVEAU
            airTemperature: session.conditions.airTemperature,
            waterTemperature: session.conditions.waterTemperature
          }
        }
      }));

      try {
        aiAnalysis = await aiEngine.analyzeUserPreferences('test_stormglass', sessionsForAI);
      } catch (error) {
        console.error('Erreur analyse IA:', error.message);
      }
    }

    res.json({
      status: 'success',
      message: '🧪 Test intégration Stormglass complète',
      tests: {
        sessionCreation: {
          success: sessionResult.success,
          dataQuality: sessionResult.dataQuality,
          enrichmentSource: sessionResult.session?.enrichment?.source
        },
        stormglassData: {
          // Données vagues complètes
          waves: {
            height: sessionResult.session?.conditions?.waveHeight,
            period: sessionResult.session?.conditions?.wavePeriod,        // NOUVEAU
            direction: sessionResult.session?.conditions?.waveDirection,   // NOUVEAU
            quality: sessionResult.session?.conditions?.waveQuality
          },
          // Données marées complètes
          tides: {
            level: sessionResult.session?.conditions?.tideLevel,          // NOUVEAU
            direction: sessionResult.session?.conditions?.tideDirection,   // NOUVEAU
            coefficient: sessionResult.session?.conditions?.tideCoefficient, // NOUVEAU
            phase: sessionResult.session?.conditions?.tidePhase,          // NOUVEAU
            nextExtreme: sessionResult.session?.conditions?.nextTideExtreme // NOUVEAU
          },
          // Données vent et météo
          weather: {
            windSpeed: sessionResult.session?.conditions?.windSpeed,
            windDirection: sessionResult.session?.conditions?.windDirection,
            airTemp: sessionResult.session?.conditions?.airTemperature,
            waterTemp: sessionResult.session?.conditions?.waterTemperature
          }
        },
        dataQuality: qualityAnalysis,
        aiAnalysis: aiAnalysis ? {
          status: aiAnalysis.status,
          dataQuality: aiAnalysis.dataQuality,
          optimalConditions: aiAnalysis.aiProfile?.optimalConditions,
          insights: aiAnalysis.insights
        } : null
      },
      completeness: {
        criticalData: {
          wavePeriod: !!sessionResult.session?.conditions?.wavePeriod,
          tideData: !!sessionResult.session?.conditions?.tideLevel,
          waveDirection: !!sessionResult.session?.conditions?.waveDirection,
          tideDirection: !!sessionResult.session?.conditions?.tideDirection
        },
        score: sessionResult.dataQuality
      },
      nextSteps: [
        'Données critiques intégrées (période vagues, marées)',
        'Sessions enrichies automatiquement',
        'IA peut maintenant faire de vraies prédictions personnalisées',
        'Prêt pour prédictions futures avec Stormglass'
      ]
    });

  } catch (error) {
    console.error('Erreur test Stormglass:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test Stormglass échoué',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
