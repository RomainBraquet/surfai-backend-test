// BACKEND - SYSTÈME DE PROFIL UTILISATEUR ÉTENDU V1
// À ajouter dans votre backend Railway

const EnhancedUserProfileService = {

   // MODÈLE DE DONNÉES UTILISATEUR COMPLET
   userProfileSchema: {
       // Identification de base
       userId: "string",
       createdAt: "timestamp",
       updatedAt: "timestamp",
       
       // Profil surfeur détaillé
       surferProfile: {
           // Niveau nuancé (1-10 au lieu de 4 catégories)
           skillLevel: {
               overall: 6, // 1-10 scale
               subSkills: {
                   paddleStrength: 7,      // Endurance rame
                   waveReading: 5,         // Lecture des vagues  
                   maneuvers: 4,           // Niveau manoeuvres
                   conditionsAdaptability: 6, // Adaptation conditions variées
                   safetyAwareness: 8      // Conscience sécurité
               },
               progression: {
                   startingLevel: 4,
                   currentLevel: 6,
                   progressionRate: "steady", // slow/steady/fast
                   plateauAlerts: false
               }
           },
           
           // Préférences physiques et limites
           physicalProfile: {
               comfortWaveRange: { min: 0.8, max: 2.2 }, // mètres
               windTolerance: 25, // km/h max
               optimalSessionDuration: 90, // minutes
               fitnessLevel: "intermediate", // beginner/intermediate/advanced/expert
               injuries: [], // Historique blessures affectant surf
               preferredTimeSlots: ["morning", "evening"] // dawn/morning/afternoon/evening/night
           }
       },

       // Équipement complet avec specs
       equipment: {
           boards: [
               {
                   id: "board_001",
                   name: "Ma Longboard Principale",
                   specifications: {
                       length: 9.2,     // pieds
                       width: 22.5,     // pouces
                       thickness: 3.0,  // pouces  
                       volume: 65.5,    // litres
                       type: "longboard",
                       construction: "PU/polyester",
                       finSetup: "single_fin"
                   },
                   details: {
                       shaper: "Robert August",
                       model: "What I Ride",
                       year: 2022,
                       condition: "excellent", // poor/fair/good/excellent
                       purchasePrice: 850,
                       currentValue: 650
                   },
                   performance: {
                       optimalConditions: {
                           waveSize: { min: 1.0, max: 2.5 },
                           waveType: ["point_break", "beach_break"],
                           windMax: 20,
                           crowdTolerance: "medium"
                       },
                       userRating: 4.2,        // 1-5 basé sur sessions
                       sessionsCount: 23,      // Nombre sessions avec cette board
                       bestSession: {
                           date: "2025-01-15",
                           spot: "Biarritz",
                           rating: 5,
                           conditions: "1.4m, offshore 10km/h"
                       }
                   }
               }
           ],
           
           wetsuits: [
               {
                   thickness: "3/2mm",
                   brand: "Patagonia R1",
                   condition: "good",
                   temperatureRange: { min: 14, max: 20 } // °C
               }
           ],
           
           accessories: {
               leashes: ["9ft longboard leash", "6ft shortboard leash"],
               wax: ["cold_water", "tropical"],
               other: ["surf_watch", "gopro", "wetsuit_boots"]
           }
       },

       // Spots avec historique personnel  
       spots: {
           favorites: [
               {
                   name: "Biarritz Grande Plage",
                   coordinates: { lat: 43.4832, lng: -1.5586 },
                   personalStats: {
                       sessionsCount: 23,
                       averageRating: 3.8,
                       bestRating: 5,
                       worstRating: 2,
                       lastSession: "2025-01-20"
                   },
                   personalInsights: {
                       bestConditions: "1.2-1.6m, vent offshore < 15km/h",
                       optimalTiming: "2h après basse mer",
                       crowdPatterns: "Moins de monde avant 8h et après 17h",
                       personalNotes: "Mon spot de progression, excellent pour longboard",
                       boardPreferences: ["Ma Longboard Principale"],
                       seasonalNotes: {
                           summer: "Parfait débutant, mais crowdé",
                           winter: "Plus gros, attention courants"
                       }
                   }
               }
           ],
           
           blacklist: [
               {
                   name: "La Nord", 
                   reason: "Trop technique pour mon niveau actuel",
                   dateAdded: "2024-12-15"
               }
           ],
           
           wishlist: [
               {
                   name: "Ericeira", 
                   country: "Portugal",
                   reason: "Trip prévu été 2025",
                   priority: "high"
               }
           ]
       },

       // Préférences et style de surf
       surfingStyle: {
           preferredSurfType: "longboard_classic", // performance/classic/soul/competitive
           riskTolerance: "conservative", // conservative/moderate/aggressive
           progressionGoals: [
               "Maîtriser cutback en longboard",
               "Surfer régulièrement en 2m+", 
               "Apprendre noseriding"
           ],
           inspirations: ["Joel Tudor", "Kassia Meador"], // Surfeurs modèles
           surfPhilosophy: "soul_surfer" // competitor/fitness/soul_surfer/lifestyle
       }
   },

   // CRÉATION/MISE À JOUR PROFIL
   async createOrUpdateProfile(userId, profileData) {
       try {
           console.log(`Mise à jour profil utilisateur ${userId}`);
           
           // Validation des données
           const validatedData = this.validateProfileData(profileData);
           
           // Calcul automatique de métriques dérivées
           const enrichedData = await this.enrichProfileData(validatedData);
           
           // Sauvegarde en base (adapter selon votre DB)
           const savedProfile = await this.saveToDatabase(userId, enrichedData);
           
           // Mise à jour cache prédictions
           await this.invalidatePredictionCache(userId);
           
           return {
               success: true,
               profile: savedProfile,
               insights: await this.generateProfileInsights(savedProfile)
           };
           
       } catch (error) {
           console.error('Erreur mise à jour profil:', error);
           return { success: false, error: error.message };
       }
   },

   // ENRICHISSEMENT AUTOMATIQUE DES DONNÉES
   async enrichProfileData(profileData) {
       const enriched = { ...profileData };
       
       // Calcul niveau global depuis sub-skills
       if (enriched.surferProfile?.skillLevel?.subSkills) {
           const subSkills = enriched.surferProfile.skillLevel.subSkills;
           const avgLevel = Object.values(subSkills).reduce((sum, val) => sum + val, 0) / Object.keys(subSkills).length;
           enriched.surferProfile.skillLevel.overall = Math.round(avgLevel * 10) / 10;
       }
       
       // Analyse équipement pour recommandations
       if (enriched.equipment?.boards) {
           enriched.equipment.analysis = this.analyzeEquipmentGaps(enriched.equipment.boards);
       }
       
       // Calcul métriques spots favoris
       if (enriched.spots?.favorites) {
           enriched.spots.analytics = this.calculateSpotAnalytics(enriched.spots.favorites);
       }
       
       return enriched;
   },

   // ANALYSE GAPS ÉQUIPEMENT
   analyzeEquipmentGaps(boards) {
       const analysis = {
           coverage: this.calculateSizeRangeCoverage(boards),
           recommendations: [],
           strengths: [],
           gaps: []
       };
       
       // Analyse couverture taille vagues
       const totalRange = { min: 10, max: 0 };
       boards.forEach(board => {
           if (board.performance?.optimalConditions?.waveSize) {
               const range = board.performance.optimalConditions.waveSize;
               totalRange.min = Math.min(totalRange.min, range.min);
               totalRange.max = Math.max(totalRange.max, range.max);
           }
       });
       
       // Détection gaps
       if (totalRange.min > 0.8) {
           analysis.gaps.push("Manque board petites vagues (< 0.8m)");
           analysis.recommendations.push({
               type: "longboard_small_waves",
               reason: "Améliorer sessions petites conditions",
               priority: "medium"
           });
       }
       
       if (totalRange.max < 2.5) {
           analysis.gaps.push("Manque board grosses vagues (> 2.5m)");
           analysis.recommendations.push({
               type: "semi_gun",
               reason: "Progresser dans vagues plus importantes",
               priority: "low"
           });
       }
       
       return analysis;
   },

   // GÉNÉRATION INSIGHTS PROFIL
   async generateProfileInsights(profile) {
       const insights = {
           strengths: [],
           improvementAreas: [],
           recommendations: [],
           progressionPath: []
       };
       
       // Analyse niveau et progression
       const skillLevel = profile.surferProfile?.skillLevel;
       if (skillLevel) {
           if (skillLevel.overall >= 7) {
               insights.strengths.push("Niveau avancé confirmé");
           }
           
           // Détection déséquilibres compétences
           const subSkills = skillLevel.subSkills;
           const avgSkill = skillLevel.overall;
           
           Object.entries(subSkills).forEach(([skill, level]) => {
               if (level < avgSkill - 1.5) {
                   insights.improvementAreas.push({
                       skill: skill,
                       currentLevel: level,
                       targetLevel: Math.min(10, avgSkill),
                       priority: "high"
                   });
               }
           });
       }
       
       // Recommandations équipement
       if (profile.equipment?.analysis?.recommendations) {
           insights.recommendations.push(...profile.equipment.analysis.recommendations);
       }
       
       // Path de progression suggéré
       insights.progressionPath = this.generateProgressionPath(profile);
       
       return insights;
   },

   // GÉNÉRATION PATH DE PROGRESSION
   generateProgressionPath(profile) {
       const currentLevel = profile.surferProfile?.skillLevel?.overall || 5;
       const path = [];
       
       if (currentLevel < 7) {
           path.push({
               phase: "Consolidation bases",
               skills: ["paddleStrength", "waveReading"],
               targetConditions: "1.0-1.8m, conditions clean",
               estimatedDuration: "3-6 mois"
           });
       }
       
       if (currentLevel >= 6) {
           path.push({
               phase: "Développement manoeuvres",
               skills: ["maneuvers", "conditionsAdaptability"], 
               targetConditions: "1.5-2.5m, conditions variées",
               estimatedDuration: "6-12 mois"
           });
       }
       
       return path;
   },

   // VALIDATION DONNÉES
   validateProfileData(data) {
       // Validation niveau (1-10)
       if (data.surferProfile?.skillLevel?.overall) {
           const level = data.surferProfile.skillLevel.overall;
           if (level < 1 || level > 10) {
               throw new Error("Niveau global doit être entre 1 et 10");
           }
       }
       
       // Validation range vagues confort
       if (data.surferProfile?.physicalProfile?.comfortWaveRange) {
           const range = data.surferProfile.physicalProfile.comfortWaveRange;
           if (range.min >= range.max) {
               throw new Error("Range vagues invalide: min doit être < max");
           }
       }
       
       return data;
   },

   // INTERFACE RÉCUPÉRATION PROFIL ENRICHI
   async getEnrichedProfile(userId) {
       try {
           const profile = await this.getFromDatabase(userId);
           if (!profile) {
               return { success: false, error: "Profil non trouvé" };
           }
           
           // Enrichir avec données temps réel
           const enriched = await this.enrichWithRealtimeData(profile);
           
           return {
               success: true,
               profile: enriched,
               lastUpdated: profile.updatedAt,
               completionLevel: this.calculateProfileCompletion(enriched)
           };
           
       } catch (error) {
           console.error('Erreur récupération profil:', error);
           return { success: false, error: error.message };
       }
   },

   // CALCUL NIVEAU COMPLÉTION PROFIL
   calculateProfileCompletion(profile) {
       let completedFields = 0;
       let totalFields = 20; // Nombre champs importants
       
       // Vérification champs essentiels
       if (profile.surferProfile?.skillLevel?.overall) completedFields++;
       if (profile.equipment?.boards?.length > 0) completedFields += 3;
       if (profile.spots?.favorites?.length > 0) completedFields += 2;
       // ... autres vérifications
       
       return {
           percentage: Math.round((completedFields / totalFields) * 100),
           missingFields: this.identifyMissingFields(profile),
           priority: completedFields < 10 ? "high" : "medium"
       };
   },

   // FONCTIONS UTILITAIRES (à implémenter selon votre DB)
   async saveToDatabase(userId, profileData) {
       // TODO: Implémenter sauvegarde selon votre base de données
       return profileData;
   },

   async getFromDatabase(userId) {
       // TODO: Implémenter récupération depuis votre base de données
       return null;
   },

   async invalidatePredictionCache(userId) {
       // TODO: Invalider cache prédictions pour forcer recalcul
       console.log(`Cache prédictions invalidé pour ${userId}`);
   },

   calculateSizeRangeCoverage(boards) {
       // Logique calcul couverture
       return { min: 0.8, max: 3.0 };
   },

   calculateSpotAnalytics(spots) {
       // Logique analytics spots
       return { totalSessions: 0, averageRating: 0 };
   },

   enrichWithRealtimeData(profile) {
       // Enrichissement temps réel
       return profile;
   },

   identifyMissingFields(profile) {
       // Identification champs manquants
       return [];
   }
};

module.exports = EnhancedUserProfileService;  
