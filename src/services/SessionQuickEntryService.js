// src/services/SessionQuickEntryService.js
// SurfAI V1 - Service de Saisie Rapide des Sessions

class SessionQuickEntryService {
  constructor() {
    this.sessions = new Map();
    this.spots = new Map();
    this.weatherCache = new Map();
    
    // Initialisation des spots français populaires
    this.initializeSpotsDatabase();
  }

  // ===== SAISIE RAPIDE SESSION =====
  
  async createQuickSession(userId, quickData) {
    const sessionId = this.generateId();
    const timestamp = new Date();
    
    try {
      // 1. Auto-detection du spot si coordonnées fournies
      let spotInfo = null;
      if (quickData.coordinates) {
        spotInfo = await this.findNearestSpot(quickData.coordinates.lat, quickData.coordinates.lng);
      }
      
      // 2. Auto-completion météo si pas fournie
      let weatherData = quickData.weather;
      if (!weatherData && spotInfo) {
        weatherData = await this.getWeatherForSpotAndTime(spotInfo.name, timestamp);
      }
      
      // 3. Construction session optimisée
      const session = {
        id: sessionId,
        userId: userId,
        createdAt: timestamp.toISOString(),
        quickEntry: true, // Flag pour sessions saisie rapide
        
        // DONNÉES ESSENTIELLES (5 champs max)
        essential: {
          spot: spotInfo ? spotInfo.name : quickData.spotName || '',
          date: quickData.date || timestamp.toISOString(),
          duration: quickData.duration || 90, // minutes par défaut
          rating: quickData.rating || 5, // 1-10
          notes: quickData.notes || '' // optionnel
        },
        
        // DONNÉES AUTO-COMPLÉTÉES
        autoCompleted: {
          coordinates: spotInfo ? spotInfo.coordinates : quickData.coordinates,
          weather: weatherData || this.getDefaultWeather(),
          spotDetails: spotInfo || null,
          entryMethod: 'quick', // vs 'detailed'
          processingTime: null // sera calculé à la fin
        },
        
        // DONNÉES DÉTAILLÉES (optionnelles, pour extension future)
        detailed: {
          equipment: quickData.equipment || null,
          waveCount: quickData.waveCount || null,
          bestWave: quickData.bestWave || null,
          crowd: quickData.crowd || 'medium',
          photos: quickData.photos || []
        },
        
        // MÉTADONNÉES UX
        ux: {
          entryDuration: null, // temps de saisie
          deviceType: quickData.deviceType || 'unknown',
          location: quickData.location || 'manual',
          completionLevel: this.calculateCompletionLevel(quickData)
        }
      };
      
      // 4. Calcul du temps de traitement
      const endTime = new Date();
      session.autoCompleted.processingTime = endTime - timestamp;
      
      // 5. Sauvegarde
      this.sessions.set(sessionId, session);
      
      // 6. Mise à jour des statistiques spot
      if (spotInfo) {
        this.updateSpotStats(spotInfo.name, session);
      }
      
      return {
        success: true,
        session: session,
        autoCompleted: {
          spot: !!spotInfo,
          weather: !!weatherData,
          coordinates: !!quickData.coordinates
        },
        processingTime: session.autoCompleted.processingTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sessionId: sessionId
      };
    }
  }

  // ===== AUTO-COMPLETION SPOT =====
  
  async findNearestSpot(lat, lng) {
    const spots = Array.from(this.spots.values());
    let nearestSpot = null;
    let minDistance = Infinity;
    
    for (const spot of spots) {
      const distance = this.calculateDistance(lat, lng, spot.coordinates.lat, spot.coordinates.lng);
      
      if (distance < minDistance && distance < 5) { // 5km max
        minDistance = distance;
        nearestSpot = {
          ...spot,
          distance: Math.round(distance * 100) / 100
        };
      }
    }
    
    return nearestSpot;
  }

  // ===== AUTO-COMPLETION MÉTÉO =====
  
  async getWeatherForSpotAndTime(spotName, dateTime) {
    const cacheKey = `${spotName}_${dateTime.toDateString()}`;
    
    // Vérifier le cache d'abord
    if (this.weatherCache.has(cacheKey)) {
      return this.weatherCache.get(cacheKey);
    }
    
    // Simulation d'appel Stormglass (à remplacer par vraie API)
    const mockWeather = {
      waveHeight: Math.random() * 2 + 0.5, // 0.5-2.5m
      wavePeriod: Math.random() * 8 + 6, // 6-14s
      windSpeed: Math.random() * 25, // 0-25 km/h
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      tide: ['low', 'mid', 'high'][Math.floor(Math.random() * 3)],
      waterTemp: Math.random() * 10 + 10, // 10-20°C
      timestamp: dateTime.toISOString(),
      source: 'auto-completed',
      confidence: 0.85
    };
    
    // Cache pour éviter les appels répétés
    this.weatherCache.set(cacheKey, mockWeather);
    
    return mockWeather;
  }

  // ===== SUGGESTIONS INTELLIGENTES =====
  
  getSpotSuggestions(userInput, userLocation = null) {
    const spots = Array.from(this.spots.values());
    const suggestions = [];
    
    // Recherche par nom
    const nameMatches = spots.filter(spot => 
      spot.name.toLowerCase().includes(userInput.toLowerCase()) ||
      spot.region.toLowerCase().includes(userInput.toLowerCase())
    ).slice(0, 3);
    
    // Recherche par proximité si localisation fournie
    if (userLocation && userLocation.lat && userLocation.lng) {
      const nearbySpots = spots
        .map(spot => ({
          ...spot,
          distance: this.calculateDistance(
            userLocation.lat, userLocation.lng,
            spot.coordinates.lat, spot.coordinates.lng
          )
        }))
        .filter(spot => spot.distance < 50) // 50km max
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      
      suggestions.push(...nearbySpots);
    }
    
    // Ajout des suggestions populaires si pas assez de résultats
    if (suggestions.length < 3) {
      const popular = spots
        .filter(spot => spot.popularity > 7)
        .slice(0, 3 - suggestions.length);
      
      suggestions.push(...popular);
    }
    
    // Déduplication et formatage
    const uniqueSuggestions = suggestions
      .filter((spot, index, self) => 
        index === self.findIndex(s => s.id === spot.id)
      )
      .slice(0, 5)
      .map(spot => ({
        id: spot.id,
        name: spot.name,
        region: spot.region,
        distance: spot.distance ? `${spot.distance.toFixed(1)}km` : null,
        type: spot.type,
        difficulty: spot.difficulty
      }));
    
    return uniqueSuggestions;
  }

  // ===== VALIDATION & PREPROCESSING =====
  
  validateQuickEntry(data) {
    const errors = [];
    
    // Validation rating
    if (data.rating && (data.rating < 1 || data.rating > 10)) {
      errors.push('Rating doit être entre 1 et 10');
    }
    
    // Validation durée
    if (data.duration && (data.duration < 5 || data.duration > 480)) {
      errors.push('Durée doit être entre 5 minutes et 8 heures');
    }
    
    // Validation coordonnées si fournies
    if (data.coordinates) {
      if (!data.coordinates.lat || !data.coordinates.lng) {
        errors.push('Coordonnées incomplètes');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ===== ANALYTICS & INSIGHTS =====
  
  getQuickEntryStats(userId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const userSessions = Array.from(this.sessions.values())
      .filter(session => 
        session.userId === userId && 
        new Date(session.createdAt) > cutoffDate &&
        session.quickEntry
      );
    
    return {
      totalSessions: userSessions.length,
      averageRating: userSessions.length > 0 ? 
        userSessions.reduce((sum, s) => sum + s.essential.rating, 0) / userSessions.length : 0,
      averageDuration: userSessions.length > 0 ? 
        userSessions.reduce((sum, s) => sum + s.essential.duration, 0) / userSessions.length : 0,
      topSpots: this.getTopSpots(userSessions),
      entryEfficiency: {
        averageProcessingTime: userSessions.length > 0 ? 
          userSessions.reduce((sum, s) => sum + (s.autoCompleted.processingTime || 0), 0) / userSessions.length : 0,
        autoCompletionRate: userSessions.length > 0 ? 
          userSessions.filter(s => s.autoCompleted.spot || s.autoCompleted.weather).length / userSessions.length : 0
      }
    };
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  calculateCompletionLevel(data) {
    let score = 0;
    const fields = ['spotName', 'rating', 'duration', 'notes', 'coordinates'];
    
    fields.forEach(field => {
      if (data[field]) score += 20;
    });
    
    return Math.min(score, 100);
  }

  getDefaultWeather() {
    return {
      waveHeight: 1.0,
      windSpeed: 10,
      windDirection: 'Variable',
      source: 'default',
      confidence: 0.1
    };
  }

  updateSpotStats(spotName, session) {
    // Mise à jour des statistiques du spot
    if (this.spots.has(spotName)) {
      const spot = this.spots.get(spotName);
      spot.sessionsCount = (spot.sessionsCount || 0) + 1;
      spot.lastSession = session.createdAt;
      spot.averageRating = ((spot.averageRating || 0) + session.essential.rating) / 2;
    }
  }

  getTopSpots(sessions) {
    const spotCounts = {};
    
    sessions.forEach(session => {
      const spotName = session.essential.spot;
      if (spotName) {
        spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;
      }
    });
    
    return Object.entries(spotCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([spot, count]) => ({ spot, count }));
  }

  // ===== INITIALISATION BASE SPOTS =====
  
  initializeSpotsDatabase() {
    const spots = [
      {
        id: 'biarritz_grande_plage',
        name: 'Biarritz - Grande Plage',
        region: 'Nouvelle-Aquitaine',
        coordinates: { lat: 43.4832, lng: -1.5586 },
        type: 'beach_break',
        difficulty: 'beginner',
        popularity: 9
      },
      {
        id: 'hossegor_la_nord',
        name: 'Hossegor - La Nord',
        region: 'Nouvelle-Aquitaine',
        coordinates: { lat: 43.6615, lng: -1.4057 },
        type: 'beach_break',
        difficulty: 'advanced',
        popularity: 10
      },
      {
        id: 'anglet_cavaliers',
        name: 'Anglet - Les Cavaliers',
        region: 'Nouvelle-Aquitaine',
        coordinates: { lat: 43.4951, lng: -1.5240 },
        type: 'beach_break',
        difficulty: 'intermediate',
        popularity: 8
      },
      {
        id: 'hendaye_plage',
        name: 'Hendaye',
        region: 'Nouvelle-Aquitaine',
        coordinates: { lat: 43.3739, lng: -1.7739 },
        type: 'beach_break',
        difficulty: 'beginner',
        popularity: 7
      },
      {
        id: 'lacanau_ocean',
        name: 'Lacanau Océan',
        region: 'Nouvelle-Aquitaine',
        coordinates: { lat: 45.0008, lng: -1.2024 },
        type: 'beach_break',
        difficulty: 'intermediate',
        popularity: 8
      }
    ];
    
    spots.forEach(spot => {
      this.spots.set(spot.id, spot);
    });
  }
}

module.exports = SessionQuickEntryService;
