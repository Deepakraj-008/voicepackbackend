const express = require('express');
const router = express.Router();
const LiveDataService = require('../services/LiveDataService');

const liveDataService = new LiveDataService();

// Get all available data categories
router.get('/categories', async (req, res) => {
  try {
    const categories = liveDataService.getAvailableCategories();
    res.json({
      success: true,
      categories: categories.map(cat => ({
        name: cat,
        display_name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: getCategoryDescription(cat)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data for a specific category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { refresh } = req.query;
    
    // Validate category
    const categories = liveDataService.getAvailableCategories();
    if (!categories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        available_categories: categories
      });
    }
    
    // Force refresh if requested
    if (refresh === 'true') {
      await liveDataService.fetchCategoryData(category);
    }
    
    const data = await liveDataService.getData(category);
    
    res.json({
      success: true,
      category,
      timestamp: new Date().toISOString(),
      data_count: Array.isArray(data) ? data.length : 1,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get multiple categories data
router.post('/multi', async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Categories array is required'
      });
    }
    
    const availableCategories = liveDataService.getAvailableCategories();
    const invalidCategories = categories.filter(cat => !availableCategories.includes(cat));
    
    if (invalidCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid categories',
        invalid_categories: invalidCategories,
        available_categories: availableCategories
      });
    }
    
    const results = {};
    
    for (const category of categories) {
      try {
        const data = await liveDataService.getData(category);
        results[category] = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          data_count: Array.isArray(data) ? data.length : 1
        };
      } catch (error) {
        results[category] = {
          success: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      categories: results,
      total_categories: Object.keys(results).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all data
router.get('/', async (req, res) => {
  try {
    const allData = liveDataService.getAllData();
    const categories = Object.keys(allData);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_categories: categories.length,
      categories: categories.map(cat => ({
        name: cat,
        display_name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        has_data: !!allData[cat],
        data_count: allData[cat] ? (Array.isArray(allData[cat]) ? allData[cat].length : 1) : 0
      })),
      data: allData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh specific category
router.post('/:category/refresh', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Validate category
    const categories = liveDataService.getAvailableCategories();
    if (!categories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        available_categories: categories
      });
    }
    
    await liveDataService.fetchCategoryData(category);
    const data = await liveDataService.getData(category);
    
    res.json({
      success: true,
      message: `Data refreshed for ${category}`,
      category,
      timestamp: new Date().toISOString(),
      data_count: Array.isArray(data) ? data.length : 1,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data summary
router.get('/summary/overview', async (req, res) => {
  try {
    const allData = liveDataService.getAllData();
    const categories = Object.keys(allData);
    
    const summary = {
      total_categories: categories.length,
      active_categories: categories.filter(cat => !!allData[cat]).length,
      last_updated: new Date().toISOString(),
      categories_summary: categories.map(cat => ({
        name: cat,
        display_name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        has_data: !!allData[cat],
        data_count: allData[cat] ? (Array.isArray(allData[cat]) ? allData[cat].length : 1) : 0,
        last_updated: allData[cat] && allData[cat].timestamp ? allData[cat].timestamp : null
      }))
    };
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to get category descriptions
function getCategoryDescription(category) {
  const descriptions = {
    weather: 'Current weather conditions and forecasts for major cities worldwide',
    news: 'Latest breaking news and top headlines from around the world',
    stocks: 'Real-time stock market data and prices for major companies',
    crypto: 'Cryptocurrency prices, market caps, and trading volumes',
    sports: 'Live sports scores, schedules, and game results',
    movies: 'Popular movies, ratings, and box office information',
    tv_shows: 'Trending TV shows, episodes, and ratings',
    trending_topics: 'Current trending topics and hashtags across social media',
    covid_stats: 'Global COVID-19 statistics and vaccination data',
    air_quality: 'Air quality index and pollution levels for major cities',
    earthquakes: 'Recent earthquake activity and seismic data',
    currency_rates: 'Foreign exchange rates and currency conversion data',
    commodity_prices: 'Prices for commodities like oil, gold, and agricultural products',
    interest_rates: 'Central bank interest rates and monetary policy data',
    inflation_data: 'Consumer price index and inflation rates by country',
    unemployment_data: 'Unemployment rates and labor market statistics',
    gdp_data: 'Gross domestic product data and economic growth metrics',
    trade_balance: 'International trade balance and import/export data',
    oil_prices: 'Crude oil prices and energy market data',
    gold_prices: 'Gold prices and precious metals market data',
    silver_prices: 'Silver prices and precious metals market data',
    bitcoin_price: 'Bitcoin price and cryptocurrency market data',
    ethereum_price: 'Ethereum price and cryptocurrency market data',
    nft_trends: 'Non-fungible token trends and marketplace data',
    social_media_trends: 'Social media engagement and trending content',
    youtube_trending: 'Trending videos and channels on YouTube',
    twitter_trends: 'Trending topics and hashtags on Twitter',
    reddit_trends: 'Popular posts and discussions on Reddit',
    github_trending: 'Trending repositories and developers on GitHub',
    hackernews: 'Top stories and discussions on Hacker News',
    product_hunt: 'New product launches and tech innovations',
    app_store_trending: 'Trending apps and games on App Store',
    google_play_trending: 'Trending apps and games on Google Play',
    steam_games: 'Popular games and player statistics on Steam',
    epic_games: 'Free games and deals on Epic Games Store',
    amazon_best_sellers: 'Best-selling products on Amazon',
    ebay_trending: 'Trending auctions and popular items on eBay',
    flight_status: 'Flight delays, cancellations, and airport information',
    traffic_updates: 'Real-time traffic conditions and road closures',
    public_transit: 'Public transportation schedules and service updates',
    parking_availability: 'Parking space availability and pricing',
    restaurant_deals: 'Restaurant promotions and dining offers',
    hotel_bookings: 'Hotel availability and booking information',
    travel_advisories: 'Travel warnings and safety advisories',
    visa_requirements: 'Visa requirements and travel documentation',
    exchange_rates: 'Currency exchange rates and conversion services',
    bank_interest_rates: 'Bank deposit and loan interest rates',
    credit_card_offers: 'Credit card promotions and rewards programs',
    loan_rates: 'Personal, auto, and home loan interest rates',
    insurance_rates: 'Insurance premiums and coverage options',
    real_estate_prices: 'Property prices and real estate market data',
    rental_prices: 'Rental market prices and availability',
    mortgage_rates: 'Home mortgage interest rates and terms',
    job_listings: 'Job openings and employment opportunities',
    salary_data: 'Salary ranges and compensation information',
    skill_trends: 'In-demand skills and professional development',
    certification_trends: 'Professional certifications and training programs',
    online_courses: 'Online learning courses and educational content',
    webinars: 'Upcoming webinars and virtual events',
    conferences: 'Industry conferences and networking events',
    research_papers: 'Latest research publications and academic papers',
    patent_filings: 'New patent applications and intellectual property'
  };
  
  return descriptions[category] || `Live data for ${category.replace(/_/g, ' ')}`;
}

module.exports = router;