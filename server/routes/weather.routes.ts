/**
 * Weather API Routes
 * Endpoints for real-time weather data and forecasts
 */

import express, { Request, Response } from 'express';
import { weatherService } from '../services/weather.service';

const router = express.Router();

/**
 * GET /api/weather/current
 * Get current weather for a location
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const { lat, lon, location } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const locationName = (location as string) || 'Unknown Location';

    const weather = await weatherService.getCurrentWeather(
      latitude,
      longitude,
      locationName
    );

    // Get weather impact analysis
    const impact = weatherService.getWeatherImpact(weather);

    // Check safety
    const safety = weatherService.isWeatherSafe(weather, weather.uvIndex || 0);

    res.json({
      success: true,
      data: {
        weather,
        impact,
        safety,
      },
    });
  } catch (error: any) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message,
    });
  }
});

/**
 * GET /api/weather/forecast
 * Get 5-day weather forecast
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    const forecast = await weatherService.getForecast(latitude, longitude);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({
      error: 'Failed to fetch weather forecast',
      message: error.message,
    });
  }
});

/**
 * GET /api/weather/uv
 * Get UV index for a location
 */
router.get('/uv', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    const uvIndex = await weatherService.getUVIndex(latitude, longitude);

    res.json({
      success: true,
      data: { uvIndex },
    });
  } catch (error: any) {
    console.error('Error fetching UV index:', error);
    res.status(500).json({
      error: 'Failed to fetch UV index',
      message: error.message,
    });
  }
});

/**
 * POST /api/weather/monitor/start
 * Start real-time weather monitoring for an event
 */
router.post('/monitor/start', async (req: Request, res: Response) => {
  try {
    const { eventId, location } = req.body;

    if (!eventId || !location || !location.lat || !location.lon) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, location.lat, location.lon',
      });
    }

    await weatherService.startMonitoring(eventId, location);

    res.json({
      success: true,
      message: `Weather monitoring started for event ${eventId}`,
      data: {
        eventId,
        location,
        updateInterval: '10 minutes',
      },
    });
  } catch (error: any) {
    console.error('Error starting weather monitoring:', error);
    res.status(500).json({
      error: 'Failed to start weather monitoring',
      message: error.message,
    });
  }
});

/**
 * POST /api/weather/monitor/stop
 * Stop weather monitoring for an event
 */
router.post('/monitor/stop', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: 'Missing required field: eventId',
      });
    }

    weatherService.stopMonitoring(eventId);

    res.json({
      success: true,
      message: `Weather monitoring stopped for event ${eventId}`,
    });
  } catch (error: any) {
    console.error('Error stopping weather monitoring:', error);
    res.status(500).json({
      error: 'Failed to stop weather monitoring',
      message: error.message,
    });
  }
});

/**
 * GET /api/weather/impact
 * Get weather impact analysis for current conditions
 */
router.get('/impact', async (req: Request, res: Response) => {
  try {
    const { lat, lon, location } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const locationName = (location as string) || 'Unknown Location';

    const weather = await weatherService.getCurrentWeather(
      latitude,
      longitude,
      locationName
    );

    const impact = weatherService.getWeatherImpact(weather);

    res.json({
      success: true,
      data: impact,
    });
  } catch (error: any) {
    console.error('Error calculating weather impact:', error);
    res.status(500).json({
      error: 'Failed to calculate weather impact',
      message: error.message,
    });
  }
});

/**
 * GET /api/weather/safety
 * Check weather safety for event conditions
 */
router.get('/safety', async (req: Request, res: Response) => {
  try {
    const { lat, lon, location } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const locationName = (location as string) || 'Unknown Location';

    const weather = await weatherService.getCurrentWeather(
      latitude,
      longitude,
      locationName
    );

    const uvIndex = await weatherService.getUVIndex(latitude, longitude);
    const safety = weatherService.isWeatherSafe(weather, uvIndex);

    res.json({
      success: true,
      data: {
        ...safety,
        weather: {
          condition: weather.condition,
          temperature: weather.temperature,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          uvIndex,
        },
      },
    });
  } catch (error: any) {
    console.error('Error checking weather safety:', error);
    res.status(500).json({
      error: 'Failed to check weather safety',
      message: error.message,
    });
  }
});

export default router;
