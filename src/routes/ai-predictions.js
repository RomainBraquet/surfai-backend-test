/**
 * Routes API pour les prédictions IA personnalisées
 * Intégration du nouveau moteur statistique réel
 * SurfAI - Version Production
 */

const express = require('express');
const router = express.Router();

// Import du nouveau moteur IA avec algorithmes réels
const AIPersonalizedPredictionEngine = require('../services/AIPersonalizedPredictionEngine');

// Services auxiliaires
const stormglassService = require('../services/stormglassService');
const EnhancedSessionService = require('../services/EnhancedSessionService');

// Instance globale du moteur IA
let aiEngine = null;

// Initialisation du moteur IA
function initializeAIEngine() {
    if (!aiEngine) {
        aiEngine = new AIPersonalizedPredictionEngine();
        console.log('🧠 Moteur IA personnalisé initialisé avec algorithmes réels');
    }
    return aiEngine;
}

/**
 * GET /api/v1/ai/status
 * Status du moteur IA et services connectés
 */
router.get('/status', (req, res) => {
    try {
        const engine = initializeAIEngine();
        
        res.json({
            success: true,
            status: 'operational',
            engine: 'AIPersonalizedPredictionEngine v2.0',
            algorithms: 'statistical_analysis_real',
            features: [
                'Analyse statistique réelle des sessions',
                'Prédictions personnalisées par utilisateur',
                'Calcul de confiance basé sur historique',
                'Insights comportementaux automatiques',
                'Scoring adaptatif selon préférences'
            ],
            services: {
                weather: 'stormglass_api',
                sessions: 'enhanced_session_service',
                spots: 'french_database'
            },
            cache: {
                userProfiles: engine.userProfiles.size,
                userSessions: engine.userSessions.size
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur initialisation moteur IA',
            details: error.message
        });
    }
});

/**
 * POST /api/v1/ai/analyze
 * Analyse les sessions d'un utilisateur et extrait ses préférences
 */
router.post('/analyze', async (req, res) => {
    try {
        const { userId, sessions } = req.body;

        if (!userId || !sessions || !Array.isArray(sessions)) {
            return res.status(400).json({
                success: false,
                error: 'userId et sessions (array) requis'
            });
        }

        const engine = initializeAIEngine();
        
        // Analyse des préférences utilisateur
        const preferences = engine.analyzeSurferPreferences(userId, sessions);
        
        res.json({
            success: true,
            userId,
            preferences,
            analysis: {
                sessionsAnalyzed: sessions.length,
                reliabilityScore: preferences.reliabilityScore,
                lastUpdated: preferences.lastUpdated
            },
            message: 'Analyse des préférences terminée avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/ai/predict
 * Prédit la qualité d'une session future
 */
router.post('/predict', async (req, res) => {
    try {
        const { userId, conditions, spot } = req.body;

        if (!userId || !conditions || !spot) {
            return res.status(400).json({
                success: false,
                error: 'userId, conditions et spot requis'
            });
        }

        const engine = initializeAIEngine();
        
        // Vérifier que l'utilisateur a été analysé
        if (!engine.userProfiles.has(userId)) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non analysé. Appelez d\'abord /analyze'
            });
        }

        // Prédiction personnalisée
        const prediction = engine.predictSessionQuality(userId, conditions, spot);
        
        res.json({
            success: true,
            prediction,
            analysis: {
                algorithm: 'personalized_statistical_scoring',
                basedOnSessions: engine.userProfiles.get(userId).totalSessions,
                reliabilityScore: engine.userProfiles.get(userId).reliabilityScore
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/ai/analyze-and-predict
 * Endpoint complet : analyse + prédiction en une seule requête
 */
router.post('/analyze-and-predict', async (req, res) => {
    try {
        const { userId, sessions, futureConditions, spotName } = req.body;

        if (!userId || !sessions || !futureConditions || !spotName) {
            return res.status(400).json({
                success: false,
                error: 'userId, sessions, futureConditions et spotName requis'
            });
        }

        const engine = initializeAIEngine();
        
        // Analyse complète avec le nouveau moteur
        const result = await engine.analyzeUserAndPredict(
            userId,
            sessions,
            futureConditions,
            spotName
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            ...result.analysis,
            meta: {
                algorithm: 'statistical_analysis_v2',
                processedAt: result.timestamp,
                version: '2.0'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/v1/ai/user/:userId/profile
 * Récupère le profil analysé d'un utilisateur
 */
router.get('/user/:userId/profile', (req, res) => {
    try {
        const { userId } = req.params;
        const engine = initializeAIEngine();
        
        const profile = engine.userProfiles.get(userId);
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profil utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            userId,
            profile,
            meta: {
                cached: true,
                lastAnalysis: profile.lastUpdated
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/ai/predict-with-weather
 * Prédiction avec récupération automatique des conditions météo
 */
router.post('/predict-with-weather', async (req, res) => {
    try {
        const { userId, spotName, datetime } = req.body;

        if (!userId || !spotName) {
            return res.status(400).json({
                success: false,
                error: 'userId et spotName requis'
            });
        }

        const engine = initializeAIEngine();
        
        // Vérifier que l'utilisateur existe
        if (!engine.userProfiles.has(userId)) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non analysé. Appelez d\'abord /analyze'
            });
        }

        // Récupérer les coordonnées du spot
        const spotData = engine.spotDatabase[spotName.toLowerCase()];
        if (!spotData) {
            return res.status(404).json({
                success: false,
                error: `Spot ${spotName} non reconnu`
            });
        }

        // Récupérer les conditions météo via Stormglass
        const weatherData = await stormglassService.getWeatherData(
            spotData.lat,
            spotData.lng,
            datetime || new Date().toISOString()
        );

        if (!weatherData.success) {
            return res.status(500).json({
                success: false,
                error: 'Erreur récupération météo',
                details: weatherData.error
            });
        }

        // Formater les conditions pour le moteur IA
        const conditions = {
            waveHeight: weatherData.data.waveHeight || 1.0,
            waveDirection: weatherData.data.waveDirection || 'W',
            windSpeed: weatherData.data.windSpeed || 10,
            windDirection: weatherData.data.windDirection || 'NE',
            wavePeriod: weatherData.data.wavePeriod || 8,
            tideHeight: weatherData.data.tideHeight || 1.5
        };

        // Prédiction personnalisée
        const prediction = engine.predictSessionQuality(userId, conditions, spotName);
        
        res.json({
            success: true,
            prediction,
            weatherData: weatherData.data,
            source: 'stormglass_api',
            spotInfo: spotData,
            meta: {
                algorithm: 'personalized_with_live_weather',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/ai/demo/test_user
 * Démonstration complète avec utilisateur de test
 */
router.get('/demo/test_user', async (req, res) => {
    try {
        const engine = initializeAIEngine();
        
        // Données de démonstration d'un surfeur intermédiaire
        const demoUserId = 'demo_intermediate_001';
        const demoSessions = [
            {
                date: '2025-01-10T07:00:00Z',
                spot: 'Hossegor',
                rating: 8,
                conditions: {
                    waveHeight: 1.5,
                    waveDirection: 'NW',
                    windSpeed: 15,
                    windDirection: 'NE',
                    wavePeriod: 11,
                    tideHeight: 2.1
                }
            },
            {
                date: '2025-01-15T16:00:00Z',
                spot: 'Biarritz',
                rating: 7,
                conditions: {
                    waveHeight: 1.8,
                    waveDirection: 'W',
                    windSpeed: 18,
                    windDirection: 'E',
                    wavePeriod: 9,
                    tideHeight: 1.0
                }
            },
            {
                date: '2025-01-22T11:00:00Z',
                spot: 'Hossegor',
                rating: 9,
                conditions: {
                    waveHeight: 1.6,
                    waveDirection: 'NW',
                    windSpeed: 12,
                    windDirection: 'NE',
                    wavePeriod: 12,
                    tideHeight: 1.7
                }
            },
            {
                date: '2025-01-28T13:30:00Z',
                spot: 'Anglet',
                rating: 6,
                conditions: {
                    waveHeight: 1.2,
                    waveDirection: 'SW',
                    windSpeed: 22,
                    windDirection: 'W',
                    wavePeriod: 8,
                    tideHeight: 0.5
                }
            },
            {
                date: '2025-02-05T09:15:00Z',
                spot: 'Hossegor',
                rating: 8,
                conditions: {
                    waveHeight: 1.7,
                    waveDirection: 'NW',
                    windSpeed: 14,
                    windDirection: 'NE',
                    wavePeriod: 10,
                    tideHeight: 1.9
                }
            }
        ];

        // Conditions futures pour test de prédiction
        const futureForecast = {
            waveHeight: 1.8,
            waveDirection: 'NW',
            windSpeed: 15,
            windDirection: 'NE',
            wavePeriod: 11,
            tideHeight: 2.0
        };

        // Analyse complète
        const result = await engine.analyzeUserAndPredict(
            demoUserId,
            demoSessions,
            futureForecast,
            'Biarritz'
        );

        res.json({
            success: true,
            demo: true,
            message: 'Démonstration complète du moteur IA avec algorithmes réels',
            ...result.analysis,
            demoData: {
                sessionsUsed: demoSessions.length,
                testConditions: futureForecast,
                targetSpot: 'Biarritz'
            },
            meta: {
                version: 'v2.0_statistical_algorithms',
                processedAt: result.timestamp,
                algorithm: 'personalized_prediction_engine'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            demo: true
        });
    }
});

/**
 * GET /api/v1/ai/algorithms/info
 * Information détaillée sur les algorithmes utilisés
 */
router.get('/algorithms/info', (req, res) => {
    const engine = initializeAIEngine();
    
    res.json({
        success: true,
        algorithms: {
            analysis: {
                name: 'Statistical Preference Analysis',
                description: 'Analyse statistique des sessions utilisateur pour extraire préférences personnelles',
                methods: [
                    'Moyenne pondérée des conditions optimales',
                    'Analyse de fréquence des directions préférées',
                    'Calcul d\'écart-type pour tolérance aux conditions',
                    'Détection de patterns temporels (heures, saisons)',
                    'Génération d\'insights comportementaux automatiques'
                ],
                inputs: ['sessions historiques', 'ratings utilisateur', 'conditions météo'],
                outputs: ['préférences vagues', 'préférences vent', 'spots favoris', 'insights']
            },
            prediction: {
                name: 'Personalized Scoring Algorithm',
                description: 'Algorithme de scoring personnalisé basé sur les préférences individuelles',
                formula: 'Score = Σ(condition_score × weight) × reliability_factor',
                weights: engine.scoringWeights,
                factors: [
                    'Distance aux conditions optimales utilisateur',
                    'Compatibilité avec préférences spots',
                    'Score de fiabilité basé sur historique',
                    'Ajustement saisonnier et temporel'
                ]
            },
            confidence: {
                name: 'Dynamic Confidence Calculator',
                description: 'Calcul de confiance basé sur la qualité et quantité des données',
                factors: [
                    'Nombre de sessions analysées',
                    'Diversité des conditions expérimentées',
                    'Récence des données',
                    'Constance des préférences utilisateur'
                ]
            }
        },
        improvements_vs_v1: [
            'Remplacement des valeurs fixes par calculs statistiques réels',
            'Analyse pondérée privilégiant les meilleures sessions',
            'Scoring adaptatif selon profil utilisateur',
            'Calcul de confiance dynamique',
            'Gestion robuste des données incomplètes'
        ],
        validation: {
            tested_profiles: ['beginner', 'intermediate', 'expert'],
            test_scenarios: ['conditions parfaites', 'conditions difficiles', 'grosses vagues'],
            robustness: ['données manquantes', 'sessions de mauvaise qualité', 'peu de données']
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/v1/ai/batch-analyze
 * Analyse en lot de plusieurs utilisateurs
 */
router.post('/batch-analyze', async (req, res) => {
    try {
        const { users } = req.body;

        if (!users || !Array.isArray(users)) {
            return res.status(400).json({
                success: false,
                error: 'Array users requis avec {userId, sessions} pour chaque utilisateur'
            });
        }

        const engine = initializeAIEngine();
        const results = {};
        const errors = {};

        // Traitement de chaque utilisateur
        for (const user of users) {
            try {
                if (!user.userId || !user.sessions) {
                    errors[user.userId || 'unknown'] = 'userId et sessions requis';
                    continue;
                }

                const preferences = engine.analyzeSurferPreferences(user.userId, user.sessions);
                results[user.userId] = {
                    success: true,
                    preferences,
                    sessionsAnalyzed: user.sessions.length
                };
            } catch (error) {
                errors[user.userId] = error.message;
            }
        }

        res.json({
            success: Object.keys(results).length > 0,
            processed: Object.keys(results).length,
            failed: Object.keys(errors).length,
            results,
            errors: Object.keys(errors).length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/ai/stats
 * Statistiques d'utilisation du moteur IA
 */
router.get('/stats', (req, res) => {
    try {
        const engine = initializeAIEngine();
        
        // Calcul des statistiques globales
        const profiles = Array.from(engine.userProfiles.values());
        
        const stats = {
            totalUsers: profiles.length,
            totalSessions: profiles.reduce((sum, p) => sum + p.totalSessions, 0),
            averageSessionsPerUser: profiles.length > 0 ? 
                Math.round(profiles.reduce((sum, p) => sum + p.totalSessions, 0) / profiles.length) : 0,
            
            reliabilityDistribution: {
                high: profiles.filter(p => p.reliabilityScore >= 0.8).length,
                medium: profiles.filter(p => p.reliabilityScore >= 0.5 && p.reliabilityScore < 0.8).length,
                low: profiles.filter(p => p.reliabilityScore < 0.5).length
            },
            
            preferredSpots: this.getTopSpots(profiles),
            
            averageOptimalConditions: {
                waveHeight: profiles.length > 0 ? 
                    Math.round((profiles.reduce((sum, p) => sum + p.wavePreferences.optimalHeight.value, 0) / profiles.length) * 10) / 10 : 0,
                windSpeed: profiles.length > 0 ?
                    Math.round(profiles.reduce((sum, p) => sum + p.windPreferences.optimalSpeed.value, 0) / profiles.length) : 0
            },
            
            lastUpdate: profiles.length > 0 ? 
                Math.max(...profiles.map(p => new Date(p.lastUpdated).getTime())) : null
        };

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/v1/ai/user/:userId
 * Supprime les données d'un utilisateur du cache
 */
router.delete('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const engine = initializeAIEngine();
        
        const hadProfile = engine.userProfiles.has(userId);
        const hadSessions = engine.userSessions.has(userId);
        
        engine.userProfiles.delete(userId);
        engine.userSessions.delete(userId);
        
        res.json({
            success: true,
            userId,
            deleted: {
                profile: hadProfile,
                sessions: hadSessions
            },
            message: hadProfile || hadSessions ? 
                'Données utilisateur supprimées' : 
                'Aucune donnée trouvée pour cet utilisateur'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/ai/compare-users
 * Compare les profils de plusieurs utilisateurs
 */
router.post('/compare-users', (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Au moins 2 userIds requis dans un array'
            });
        }

        const engine = initializeAIEngine();
        const comparison = {};
        const notFound = [];

        userIds.forEach(userId => {
            const profile = engine.userProfiles.get(userId);
            if (profile) {
                comparison[userId] = {
                    sessions: profile.totalSessions,
                    reliability: Math.round(profile.reliabilityScore * 100),
                    optimalWaveHeight: profile.wavePreferences.optimalHeight.value,
                    optimalWindSpeed: profile.windPreferences.optimalSpeed.value,
                    favoriteSpot: profile.spotPreferences.favorite.name,
                    insights: profile.behavioralInsights.slice(0, 2) // 2 premiers insights
                };
            } else {
                notFound.push(userId);
            }
        });

        if (Object.keys(comparison).length < 2) {
            return res.status(404).json({
                success: false,
                error: 'Pas assez d\'utilisateurs analysés pour comparaison',
                notFound
            });
        }

        res.json({
            success: true,
            comparison,
            notFound: notFound.length > 0 ? notFound : undefined,
            analysis: {
                mostExperienced: Object.keys(comparison).reduce((a, b) => 
                    comparison[a].sessions > comparison[b].sessions ? a : b),
                mostReliable: Object.keys(comparison).reduce((a, b) => 
                    comparison[a].reliability > comparison[b].reliability ? a : b),
                biggestWaveRider: Object.keys(comparison).reduce((a, b) => 
                    comparison[a].optimalWaveHeight > comparison[b].optimalWaveHeight ? a : b)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Fonction utilitaire pour les statistiques des spots
function getTopSpots(profiles) {
    const spotCounts = {};
    
    profiles.forEach(profile => {
        if (profile.spotPreferences && profile.spotPreferences.ranking) {
            profile.spotPreferences.ranking.forEach(spot => {
                spotCounts[spot.name] = (spotCounts[spot.name] || 0) + spot.sessionsCount;
            });
        }
    });
    
    return Object.entries(spotCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, sessions]) => ({ name, sessions }));
}

module.exports = router;
