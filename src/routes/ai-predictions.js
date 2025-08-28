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

// ROUTE TEST SCORING PERSONNALISÉ - ÉTAPE 2
router.post('/predict/test', async (req, res) => {
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
      }
    ];

    console.log('🧠 Apprentissage des préférences...');
    await aiEngine.analyzeUserPreferences('test_user_scoring', demoSessions);

    console.log('🎯 Test prédiction personnalisée...');
    
    const predictionOptimal = await aiEngine.predictSessionQuality(
      'test_user_scoring',
      'Biarritz - Grande Plage',
      new Date().toISOString(),
      { waveHeight: 1.1, windSpeed: 9, windDirection: 'E' }
    );

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

// ROUTE TEST STORMGLASS - ÉTAPE 3
router.get('/test-stormglass', async (req, res) => {
  try {
    console.log('🌊 Test intégration Stormglass...');
    
    // Import du service Stormglass amélioré
    let stormglassService;
    try {
      stormglassService = require('../services/stormglassService');
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Service Stormglass non trouvé',
        error: 'Fichier stormglassService.js manquant ou erreur import',
        solution: 'Vérifiez que le fichier existe dans src/services/'
      });
    }
    
    // Test de connexion
    const connectionTest = await stormglassService.testConnection();
    
    if (!connectionTest.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Connexion Stormglass échouée',
        error: connectionTest.error,
        suggestion: connectionTest.suggestion
      });
    }

    // Test récupération données complètes pour session
    const sessionDataTest = await stormglassService.getCompleteSessionData(
      43.4832, // Biarritz
      -1.5586,
      new Date().toISOString()
    );

    res.json({
      status: 'success',
      message: '✅ Test Stormglass avec données complètes réussi',
      tests: {
        connection: connectionTest,
        sessionData: {
          coordinates: sessionDataTest.coordinates,
          dataQuality: sessionDataTest.dataQuality,
          marine: sessionDataTest.marine,
          tide: sessionDataTest.tide
        }
      },
      validation: {
        hasWavePeriod: !!sessionDataTest.marine.wavePeriod,
        hasTideData: !!sessionDataTest.tide.level,
        hasTideDirection: !!sessionDataTest.tide.direction,
        hasTideCoeff: !!sessionDataTest.tide.coefficient,
        completeness: sessionDataTest.dataQuality
      },
      comparison: {
        before: {
          data: 'waveHeight: 1.2, windSpeed: 10',
          intelligence: 'Basique'
        },
        after: {
          data: `waveHeight: ${sessionDataTest.marine.waveHeight}, wavePeriod: ${sessionDataTest.marine.wavePeriod}, tideLevel: ${sessionDataTest.tide.level}, tideDirection: ${sessionDataTest.tide.direction}`,
          intelligence: 'Intelligence surf complète'
        }
      }
    });

  } catch (error) {
    console.error('Erreur test Stormglass:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test Stormglass échoué',
      error: error.message,
      troubleshooting: [
        'Vérifiez que stormglassService.js est à jour',
        'Vérifiez la variable STORMGLASS_API_KEY',
        'Vérifiez la connexion internet'
      ]
    });
  }
});

module.exports = router;
