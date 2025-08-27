// server.js
// SurfAI Backend avec Profil Utilisateur Étendu

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== IMPORTS DES ROUTES =====
// Routes existantes (si elles existent)
let smartSlotsRouter;
try {
  smartSlotsRouter = require('./src/routes/smartSlots');
} catch (error) {
  console.log('Routes smartSlots non trouvées, création de routes mock...');
}

// Nouvelles routes profil
let profileRouter;
try {
  profileRouter = require('./src/routes/profile');
  console.log('✅ Routes profil chargées avec succès');
} catch (error) {
  console.log('❌ Erreur chargement routes profil:', error.message);
}

// ===== ROUTES DE BASE =====

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      smartSlots: smartSlotsRouter ? 'active' : 'inactive',
      userProfile: profileRouter ? 'active' : 'inactive'
    }
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'SurfAI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      smartSlots: '/api/v1/smart-slots',
      profile: '/api/v1/profile'
    },
    features: [
      'Prédictions surf intelligentes',
      'Profil utilisateur étendu',
      'Gestion équipement',
      'Historique sessions',
      'Recommandations personnalisées'
    ]
  });
});

// ===== ROUTES API =====

// Routes smart-slots existantes (si disponibles)
if (smartSlotsRouter) {
  app.use('/api/v1/smart-slots', smartSlotsRouter);
  console.log('✅ Routes smart-slots montées sur /api/v1/smart-slots');
} else {
  // Route mock pour smart-slots si pas disponible
  app.get('/api/v1/smart-slots', (req, res) => {
    res.json({
      status: 'success',
      message: 'Smart-slots mock - service en développement',
      data: {
        spot: 'Biarritz',
        conditions: 'Mock data - intégration Stormglass en cours',
        slots: [
          {
            time: '09:00',
            score: 8.5,
            conditions: 'Excellent pour débutants'
          }
        ]
      }
    });
  });
  console.log('⚠️  Routes smart-slots mock créées');
}

// Nouvelles routes profil
if (profileRouter) {
  app.use('/api/v1/profile', profileRouter);
  console.log('✅ Routes profil montées sur /api/v1/profile');
} else {
  // Route mock pour profil si pas disponible
  app.get('/api/v1/profile/test', (req, res) => {
    res.json({
      status: 'error',
      message: 'Service profil non disponible - vérifiez le fichier routes/profile.js'
    });
  });
  console.log('❌ Routes profil non disponibles - mock créé');
}

// ===== ROUTES DE TEST SPÉCIFIQUES =====

// Test intégration complète
app.get('/api/v1/test/integration', (req, res) => {
  res.json({
    status: 'success',
    message: 'SurfAI V1 - Test d\'intégration',
    timestamp: new Date().toISOString(),
    components: {
      server: 'OK',
      cors: 'OK',
      express: 'OK',
      smartSlots: smartSlotsRouter ? 'OK' : 'MOCK',
      userProfile: profileRouter ? 'OK' : 'ERROR'
    },
    nextSteps: [
      'Tester /api/v1/profile/test',
      'Créer un profil utilisateur test',
      'Intégrer avec le frontend'
    ]
  });
});

// Test création profil rapide
app.post('/api/v1/test/quick-profile', (req, res) => {
  if (!profileRouter) {
    return res.status(500).json({
      status: 'error',
      message: 'Service profil non disponible'
    });
  }

  // Données de test par défaut
  const testProfile = {
    name: 'Test Surfer',
    email: 'test@surfai.com',
    location: 'Biarritz, France',
    surfLevel: 5,
    minWaveSize: 0.5,
    maxWaveSize: 2.5,
    optimalWaveSize: 1.5,
    maxTravelDistance: 25
  };

  res.json({
    status: 'success',
    message: 'Profil test créé',
    data: testProfile,
    info: 'Utilisez POST /api/v1/profile/create avec ces données pour tester'
  });
});

// ===== GESTION D'ERREURS =====

// 404 - Route non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route non trouvée',
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/v1/smart-slots',
      'GET /api/v1/profile/test',
      'POST /api/v1/profile/create',
      'GET /api/v1/test/integration'
    ]
  });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    status: 'error',
    message: 'Erreur interne du serveur',
    timestamp: new Date().toISOString()
  });
});

// ===== DÉMARRAGE SERVEUR =====
app.listen(PORT, () => {
  console.log('\n🚀 ===== SURFAI BACKEND V1 DÉMARRÉ =====');
  console.log(`📡 Serveur: http://localhost:${PORT}`);
  console.log(`🌐 Production: Railway auto-deploy détecté`);
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   - Health: ${PORT}/health`);
  console.log(`   - API Root: ${PORT}/api/v1`);
  console.log(`   - Smart Slots: ${PORT}/api/v1/smart-slots`);
  console.log(`   - Profile: ${PORT}/api/v1/profile/test`);
  console.log(`   - Integration: ${PORT}/api/v1/test/integration`);
  console.log('\n🔧 Services:');
  console.log(`   - Smart Slots: ${smartSlotsRouter ? '✅ Actif' : '⚠️  Mock'}`);
  console.log(`   - User Profile: ${profileRouter ? '✅ Actif' : '❌ Erreur'}`);
  console.log('\n🏄‍♂️ SurfAI V1 ready to surf!\n');
});
