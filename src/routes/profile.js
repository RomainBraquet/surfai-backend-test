// src/routes/profile.js
// SurfAI V1 - Routes API pour Profil Utilisateur Étendu

const express = require('express');
const router = express.Router();

// Import du service (sera créé à l'étape précédente)
let EnhancedUserProfileService;
try {
  const ServiceClass = require('../services/EnhancedUserProfileService');
  EnhancedUserProfileService = ServiceClass;
} catch (error) {
  console.log('Service non trouvé, utilisation de mock');
}

// Instance du service
let profileService;
if (EnhancedUserProfileService) {
  profileService = new EnhancedUserProfileService();
}

// ===== ROUTES PROFIL UTILISATEUR =====

// GET /api/v1/profile/test - Test du service
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Service de profil étendu opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Profil utilisateur détaillé',
      'Gestion équipement',
      'Préférences personnalisées',
      'Historique sessions',
      'Spots favoris',
      'Système de progression'
    ]
  });
});

// POST /api/v1/profile/create - Créer un nouveau profil
router.post('/create', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const profileData = req.body;
    
    // Validation des données minimales
    if (!profileData.name || !profileData.email) {
      return res.status(400).json({
        status: 'error',
        message: 'Nom et email requis'
      });
    }

    const newProfile = profileService.createUserProfile(profileData);
    
    res.status(201).json({
      status: 'success',
      message: 'Profil créé avec succès',
      data: newProfile
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/v1/profile/:userId - Récupérer un profil
router.get('/:userId', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const profile = profileService.getUserProfile(userId);
    
    res.json({
      status: 'success',
      data: profile
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// PUT /api/v1/profile/:userId - Mettre à jour un profil
router.put('/:userId', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const updates = req.body;
    
    const updatedProfile = profileService.updateUserProfile(userId, updates);
    
    res.json({
      status: 'success',
      message: 'Profil mis à jour',
      data: updatedProfile
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===== ROUTES ÉQUIPEMENT =====

// POST /api/v1/profile/:userId/equipment/board - Ajouter une planche
router.post('/:userId/equipment/board', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const boardData = req.body;
    
    const result = profileService.addBoard(userId, boardData);
    
    res.status(201).json({
      status: 'success',
      message: 'Planche ajoutée',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/v1/profile/:userId/equipment - Récupérer équipement
router.get('/:userId/equipment', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const profile = profileService.getUserProfile(userId);
    
    res.json({
      status: 'success',
      data: profile.equipment
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===== ROUTES SESSIONS =====

// POST /api/v1/profile/:userId/session - Ajouter une session
router.post('/:userId/session', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const sessionData = req.body;
    
    const result = profileService.addSession(userId, sessionData);
    
    res.status(201).json({
      status: 'success',
      message: 'Session enregistrée',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/v1/profile/:userId/sessions - Récupérer historique sessions
router.get('/:userId/sessions', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const sessions = profileService.getUserSessions(userId, parseInt(limit), parseInt(offset));
    
    res.json({
      status: 'success',
      data: sessions
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===== ROUTES SPOTS FAVORIS =====

// POST /api/v1/profile/:userId/spots/favorite - Ajouter spot favori
router.post('/:userId/spots/favorite', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const { spotId, reason } = req.body;
    
    const result = profileService.addFavoriteSpot(userId, spotId, reason);
    
    res.status(201).json({
      status: 'success',
      message: 'Spot ajouté aux favoris',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/v1/profile/:userId/spots - Récupérer spots utilisateur
router.get('/:userId/spots', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const profile = profileService.getUserProfile(userId);
    
    res.json({
      status: 'success',
      data: {
        favorites: profile.spots.favorites,
        history: profile.spots.history,
        blacklist: profile.spots.blacklist
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===== ROUTES PERSONNALISATION =====

// GET /api/v1/profile/:userId/recommendations - Recommandations personnalisées
router.get('/:userId/recommendations', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const { lat, lng, days = 3 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Coordonnées latitude et longitude requises'
      });
    }
    
    const recommendations = profileService.getPersonalizedRecommendations(
      userId, 
      parseFloat(lat), 
      parseFloat(lng), 
      parseInt(days)
    );
    
    res.json({
      status: 'success',
      data: recommendations
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET /api/v1/profile/:userId/progress - Suivi progression
router.get('/:userId/progress', async (req, res) => {
  try {
    if (!profileService) {
      return res.status(500).json({
        status: 'error',
        message: 'Service non disponible'
      });
    }

    const { userId } = req.params;
    const progress = profileService.getProgressTracking(userId);
    
    res.json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// Export du router
module.exports = router;
