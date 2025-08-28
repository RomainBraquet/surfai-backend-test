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
        essential: { spot: 'Biarritz - Grande Plage', rating: 8, date: new Date().toISOString() },
        autoCompleted: { weather: { waveHeight: 1.2, windSpeed: 10 } }
      }
    ];

    const analysis = await aiEngine.analyzeUserPreferences(req.params.userId, demoSessions);
    
    res.json({
      status: 'success',
      message: 'Démo IA fonctionnelle',
      userId: req.params.userId,
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
