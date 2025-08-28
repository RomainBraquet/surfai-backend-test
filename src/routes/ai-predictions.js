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

router.post('/predict/demo', async (req, res) => {
  if (!aiEngine) {
    return res.status(500).json({ status: 'error', message: 'Moteur IA non disponible' });
  }

  try {
    // 1. Analyser les préférences (stockage automatique)
    const demoSessions = [/* vos sessions de démo existantes */];
    await aiEngine.analyzeUserPreferences('test_user', demoSessions);
    
    // 2. Test prédiction personnalisée
    const prediction = await aiEngine.predictSessionQuality(
      'test_user',
      'Biarritz - Grande Plage', 
      new Date().toISOString(),
      { waveHeight: 1.1, windSpeed: 9, windDirection: 'E' }
    );
    
    res.json({ status: 'success', prediction });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
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


module.exports = router;
