const EventEmitter = require('events');
const axios = require('axios');
const cron = require('node-cron');

class LiveDataService extends EventEmitter {
  constructor() {
    super();
    this.data = {};
    this.cache = new Map();
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // API Keys (should be in environment variables)
    this.apiKeys = {
      weather: process.env.OPENWEATHER_API_KEY || 'demo',
      news: process.env.NEWS_API_KEY || 'demo',
      stocks: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
      crypto: process.env.COINMARKETCAP_API_KEY || 'demo',
      sports: process.env.SPORTS_API_KEY || 'demo',
      movies: process.env.TMDB_API_KEY || 'demo'
    };
  }

  // Define all 50+ data categories
  getCategories() {
    return [
      'weather', 'news', 'stocks', 'crypto', 'sports', 'movies', 'tv_shows',
      'trending_topics', 'covid_stats', 'air_quality', 'earthquakes', 'currency_rates',
      'commodity_prices', 'interest_rates', 'inflation_data', 'unemployment_data',
      'gdp_data', 'trade_balance', 'oil_prices', 'gold_prices', 'silver_prices',
      'bitcoin_price', 'ethereum_price', 'nft_trends', 'social_media_trends',
      'youtube_trending', 'twitter_trends', 'reddit_trends', 'github_trending',
      'hackernews', 'product_hunt', 'app_store_trending', 'google_play_trending',
      'steam_games', 'epic_games', 'amazon_best_sellers', 'ebay_trending',
      'flight_status', 'traffic_updates', 'public_transit', 'parking_availability',
      'restaurant_deals', 'hotel_bookings', 'travel_advisories', 'visa_requirements',
      'exchange_rates', 'bank_interest_rates', 'credit_card_offers', 'loan_rates',
      'insurance_rates', 'real_estate_prices', 'rental_prices', 'mortgage_rates',
      'job_listings', 'salary_data', 'skill_trends', 'certification_trends',
      'online_courses', 'webinars', 'conferences', 'research_papers', 'patent_filings'
    ];
  }

  async startFetching() {
    console.log('Starting live data fetching service...');
    
    // Initial fetch
    await this.fetchAllData();
    
    // Schedule periodic updates
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running scheduled data update...');
      await this.fetchAllData();
    });
  }

  async fetchAllData() {
    const categories = this.getCategories();
    
    for (const category of categories) {
      try {
        await this.fetchCategoryData(category);
      } catch (error) {
        console.error(`Error fetching ${category} data:`, error.message);
      }
    }
  }

  async fetchCategoryData(category) {
    let data = null;
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        switch (category) {
          case 'weather':
            data = await this.fetchWeatherData();
            break;
          case 'news':
            data = await this.fetchNewsData();
            break;
          case 'stocks':
            data = await this.fetchStocksData();
            break;
          case 'crypto':
            data = await this.fetchCryptoData();
            break;
          case 'sports':
            data = await this.fetchSportsData();
            break;
          case 'movies':
            data = await this.fetchMoviesData();
            break;
          case 'tv_shows':
            data = await this.fetchTVShowsData();
            break;
          case 'trending_topics':
            data = await this.fetchTrendingTopics();
            break;
          case 'covid_stats':
            data = await this.fetchCovidStats();
            break;
          case 'air_quality':
            data = await this.fetchAirQualityData();
            break;
          case 'earthquakes':
            data = await this.fetchEarthquakeData();
            break;
          case 'currency_rates':
            data = await this.fetchCurrencyRates();
            break;
          case 'commodity_prices':
            data = await this.fetchCommodityPrices();
            break;
          case 'interest_rates':
            data = await this.fetchInterestRates();
            break;
          case 'bitcoin_price':
            data = await this.fetchBitcoinPrice();
            break;
          case 'ethereum_price':
            data = await this.fetchEthereumPrice();
            break;
          case 'social_media_trends':
            data = await this.fetchSocialMediaTrends();
            break;
          case 'youtube_trending':
            data = await this.fetchYouTubeTrending();
            break;
          case 'twitter_trends':
            data = await this.fetchTwitterTrends();
            break;
          case 'reddit_trends':
            data = await this.fetchRedditTrending();
            break;
          case 'github_trending':
            data = await this.fetchGitHubTrending();
            break;
          case 'hackernews':
            data = await this.fetchHackerNews();
            break;
          case 'product_hunt':
            data = await this.fetchProductHunt();
            break;
          case 'steam_games':
            data = await this.fetchSteamGames();
            break;
          case 'amazon_best_sellers':
            data = await this.fetchAmazonBestSellers();
            break;
          case 'flight_status':
            data = await this.fetchFlightStatus();
            break;
          case 'traffic_updates':
            data = await this.fetchTrafficUpdates();
            break;
          case 'restaurant_deals':
            data = await this.fetchRestaurantDeals();
            break;
          case 'hotel_bookings':
            data = await this.fetchHotelBookings();
            break;
          case 'exchange_rates':
            data = await this.fetchExchangeRates();
            break;
          case 'job_listings':
            data = await this.fetchJobListings();
            break;
          case 'online_courses':
            data = await this.fetchOnlineCourses();
            break;
          default:
            // For categories not implemented yet, return mock data
            data = this.generateMockData(category);
        }

        if (data) {
          this.data[category] = data;
          this.cache.set(category, { data, timestamp: Date.now() });
          this.emit('dataUpdate', category, data);
        }
        
        break; // Success, exit retry loop
      } catch (error) {
        retries++;
        console.error(`Error fetching ${category} (attempt ${retries}):`, error.message);
        
        if (retries < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * retries));
        }
      }
    }
  }

  // Weather data
  async fetchWeatherData() {
    const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Mumbai'];
    const weatherData = [];
    
    for (const city of cities) {
      try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            q: city,
            appid: this.apiKeys.weather,
            units: 'metric'
          }
        });
        
        weatherData.push({
          city: response.data.name,
          temperature: response.data.main.temp,
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          wind_speed: response.data.wind.speed,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error fetching weather for ${city}:`, error.message);
      }
    }
    
    return weatherData;
  }

  // News data
  async fetchNewsData() {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          apiKey: this.apiKeys.news,
          pageSize: 10
        }
      });
      
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        image: article.urlToImage
      }));
    } catch (error) {
      console.error('Error fetching news:', error.message);
      return this.generateMockNews();
    }
  }

  // Stocks data
  async fetchStocksData() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    const stocksData = [];
    
    for (const symbol of symbols) {
      try {
        const response = await axios.get(`https://www.alphavantage.co/query`, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: this.apiKeys.stocks
          }
        });
        
        const quote = response.data['Global Quote'];
        if (quote) {
          stocksData.push({
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            change_percent: quote['10. change percent'],
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error.message);
      }
    }
    
    return stocksData.length > 0 ? stocksData : this.generateMockStocks();
  }

  // Crypto data
  async fetchCryptoData() {
    try {
      const response = await axios.get('https://api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKeys.crypto
        },
        params: {
          limit: 10,
          convert: 'USD'
        }
      });
      
      return response.data.data.map(coin => ({
        name: coin.name,
        symbol: coin.symbol,
        price: coin.quote.USD.price,
        change_24h: coin.quote.USD.percent_change_24h,
        market_cap: coin.quote.USD.market_cap,
        volume_24h: coin.quote.USD.volume_24h
      }));
    } catch (error) {
      console.error('Error fetching crypto data:', error.message);
      return this.generateMockCrypto();
    }
  }

  // Sports data
  async fetchSportsData() {
    try {
      // Using a free sports API or mock data
      return this.generateMockSportsData();
    } catch (error) {
      console.error('Error fetching sports data:', error.message);
      return this.generateMockSportsData();
    }
  }

  // Movies data
  async fetchMoviesData() {
    try {
      const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
        params: {
          api_key: this.apiKeys.movies,
          page: 1
        }
      });
      
      return response.data.results.slice(0, 10).map(movie => ({
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        rating: movie.vote_average,
        poster_path: movie.poster_path,
        popularity: movie.popularity
      }));
    } catch (error) {
      console.error('Error fetching movies data:', error.message);
      return this.generateMockMovies();
    }
  }

  // TV Shows data
  async fetchTVShowsData() {
    try {
      const response = await axios.get('https://api.themoviedb.org/3/tv/popular', {
        params: {
          api_key: this.apiKeys.movies,
          page: 1
        }
      });
      
      return response.data.results.slice(0, 10).map(show => ({
        name: show.name,
        overview: show.overview,
        first_air_date: show.first_air_date,
        rating: show.vote_average,
        poster_path: show.poster_path,
        popularity: show.popularity
      }));
    } catch (error) {
      console.error('Error fetching TV shows data:', error.message);
      return this.generateMockTVShows();
    }
  }

  // Trending topics
  async fetchTrendingTopics() {
    return this.generateMockTrendingTopics();
  }

  // COVID stats
  async fetchCovidStats() {
    return this.generateMockCovidStats();
  }

  // Air quality
  async fetchAirQualityData() {
    return this.generateMockAirQuality();
  }

  // Earthquake data
  async fetchEarthquakeData() {
    return this.generateMockEarthquakes();
  }

  // Currency rates
  async fetchCurrencyRates() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      return response.data;
    } catch (error) {
      return this.generateMockCurrencyRates();
    }
  }

  // Commodity prices
  async fetchCommodityPrices() {
    return this.generateMockCommodityPrices();
  }

  // Interest rates
  async fetchInterestRates() {
    return this.generateMockInterestRates();
  }

  // Bitcoin price
  async fetchBitcoinPrice() {
    try {
      const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json');
      return response.data;
    } catch (error) {
      return this.generateMockBitcoinPrice();
    }
  }

  // Ethereum price
  async fetchEthereumPrice() {
    return this.generateMockEthereumPrice();
  }

  // Social media trends
  async fetchSocialMediaTrends() {
    return this.generateMockSocialMediaTrends();
  }

  // YouTube trending
  async fetchYouTubeTrending() {
    return this.generateMockYouTubeTrending();
  }

  // Twitter trends
  async fetchTwitterTrends() {
    return this.generateMockTwitterTrends();
  }

  // Reddit trending
  async fetchRedditTrending() {
    try {
      const response = await axios.get('https://www.reddit.com/r/all/hot.json?limit=10');
      return response.data.data.children.map(child => ({
        title: child.data.title,
        subreddit: child.data.subreddit,
        score: child.data.score,
        comments: child.data.num_comments,
        url: child.data.url,
        author: child.data.author
      }));
    } catch (error) {
      return this.generateMockRedditTrending();
    }
  }

  // GitHub trending
  async fetchGitHubTrending() {
    return this.generateMockGitHubTrending();
  }

  // Hacker News
  async fetchHackerNews() {
    return this.generateMockHackerNews();
  }

  // Product Hunt
  async fetchProductHunt() {
    return this.generateMockProductHunt();
  }

  // Steam games
  async fetchSteamGames() {
    return this.generateMockSteamGames();
  }

  // Amazon best sellers
  async fetchAmazonBestSellers() {
    return this.generateMockAmazonBestSellers();
  }

  // Flight status
  async fetchFlightStatus() {
    return this.generateMockFlightStatus();
  }

  // Traffic updates
  async fetchTrafficUpdates() {
    return this.generateMockTrafficUpdates();
  }

  // Restaurant deals
  async fetchRestaurantDeals() {
    return this.generateMockRestaurantDeals();
  }

  // Hotel bookings
  async fetchHotelBookings() {
    return this.generateMockHotelBookings();
  }

  // Exchange rates
  async fetchExchangeRates() {
    return this.fetchCurrencyRates();
  }

  // Job listings
  async fetchJobListings() {
    return this.generateMockJobListings();
  }

  // Online courses
  async fetchOnlineCourses() {
    return this.generateMockOnlineCourses();
  }

  // Mock data generators
  generateMockData(category) {
    const generators = {
      'gdp_data': () => this.generateMockGDPData(),
      'trade_balance': () => this.generateMockTradeBalance(),
      'oil_prices': () => this.generateMockOilPrices(),
      'gold_prices': () => this.generateMockGoldPrices(),
      'silver_prices': () => this.generateMockSilverPrices(),
      'nft_trends': () => this.generateMockNFTTrends(),
      'app_store_trending': () => this.generateMockAppStoreTrending(),
      'google_play_trending': () => this.generateMockGooglePlayTrending(),
      'epic_games': () => this.generateMockEpicGames(),
      'ebay_trending': () => this.generateMockEbayTrending(),
      'travel_advisories': () => this.generateMockTravelAdvisories(),
      'visa_requirements': () => this.generateMockVisaRequirements(),
      'bank_interest_rates': () => this.generateMockBankInterestRates(),
      'credit_card_offers': () => this.generateMockCreditCardOffers(),
      'loan_rates': () => this.generateMockLoanRates(),
      'insurance_rates': () => this.generateMockInsuranceRates(),
      'real_estate_prices': () => this.generateMockRealEstatePrices(),
      'rental_prices': () => this.generateMockRentalPrices(),
      'mortgage_rates': () => this.generateMockMortgageRates(),
      'salary_data': () => this.generateMockSalaryData(),
      'skill_trends': () => this.generateMockSkillTrends(),
      'certification_trends': () => this.generateMockCertificationTrends(),
      'webinars': () => this.generateMockWebinars(),
      'conferences': () => this.generateMockConferences(),
      'research_papers': () => this.generateMockResearchPapers(),
      'patent_filings': () => this.generateMockPatentFilings(),
      'inflation_data': () => this.generateMockInflationData(),
      'unemployment_data': () => this.generateMockUnemploymentData()
    };

    const generator = generators[category];
    return generator ? generator() : this.generateGenericMockData(category);
  }

  generateMockNews() {
    const headlines = [
      'Breaking: Major Scientific Discovery Announced',
      'Technology Giant Unveils Revolutionary Product',
      'Global Climate Summit Reaches Historic Agreement',
      'Economic Markets Show Significant Growth',
      'New Space Mission Launches Successfully'
    ];
    
    return headlines.map((title, index) => ({
      title,
      description: `Latest update on ${title.toLowerCase()}. This story is developing and more details will be available soon.`,
      url: `https://example.com/news/${index + 1}`,
      publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
      source: 'Live News Network',
      image: `https://picsum.photos/400/200?random=${index}`
    }));
  }

  generateMockStocks() {
    const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    return stocks.map(symbol => ({
      symbol,
      price: Math.random() * 500 + 100,
      change: (Math.random() - 0.5) * 20,
      change_percent: `${((Math.random() - 0.5) * 5).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockCrypto() {
    const cryptos = ['Bitcoin', 'Ethereum', 'Cardano', 'Solana', 'Polkadot'];
    return cryptos.map(name => ({
      name,
      symbol: name.substring(0, 3).toUpperCase(),
      price: Math.random() * 50000 + 1000,
      change_24h: (Math.random() - 0.5) * 20,
      market_cap: Math.random() * 1000000000000,
      volume_24h: Math.random() * 50000000000
    }));
  }

  generateMockSportsData() {
    const sports = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis'];
    return sports.map(sport => ({
      sport,
      event: `${sport} Championship Match`,
      score: `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 5)}`,
      status: ['Live', 'Finished', 'Upcoming'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }));
  }

  generateMockMovies() {
    const movies = ['Action Blockbuster', 'Romantic Comedy', 'Sci-Fi Epic', 'Horror Thriller', 'Drama Masterpiece'];
    return movies.map((title, index) => ({
      title: `${title} ${2024 - index}`,
      overview: `An amazing ${title.toLowerCase()} that will keep you on the edge of your seat.`,
      release_date: new Date(2024 - index, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      rating: Math.random() * 10,
      poster_path: `https://picsum.photos/200/300?random=${index}`,
      popularity: Math.random() * 100
    }));
  }

  generateMockTVShows() {
    const shows = ['Crime Drama', 'Comedy Series', 'Documentary', 'Reality Show', 'Animated Series'];
    return shows.map((name, index) => ({
      name: `${name} Show`,
      overview: `A captivating ${name.toLowerCase()} that has audiences talking.`,
      first_air_date: new Date(2020 - index, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      rating: Math.random() * 10,
      poster_path: `https://picsum.photos/200/300?random=${index + 100}`,
      popularity: Math.random() * 100
    }));
  }

  generateMockTrendingTopics() {
    const topics = ['#Technology', '#ClimateChange', '#SpaceExploration', '#ArtificialIntelligence', '#RenewableEnergy'];
    return topics.map((topic, index) => ({
      topic,
      mentions: Math.floor(Math.random() * 100000),
      sentiment: ['Positive', 'Negative', 'Neutral'][Math.floor(Math.random() * 3)],
      growth: `${((Math.random() - 0.5) * 200).toFixed(1)}%`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockCovidStats() {
    return {
      global_cases: Math.floor(Math.random() * 1000000000),
      global_deaths: Math.floor(Math.random() * 10000000),
      global_recovered: Math.floor(Math.random() * 900000000),
      active_cases: Math.floor(Math.random() * 100000000),
      last_updated: new Date().toISOString()
    };
  }

  generateMockAirQuality() {
    const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Mumbai'];
    return cities.map(city => ({
      city,
      aqi: Math.floor(Math.random() * 500),
      level: ['Good', 'Moderate', 'Unhealthy', 'Hazardous'][Math.floor(Math.random() * 4)],
      pm25: Math.random() * 100,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockEarthquakes() {
    return Array.from({ length: 5 }, (_, i) => ({
      magnitude: (Math.random() * 7 + 1).toFixed(1),
      location: `Region ${i + 1}`,
      depth: Math.floor(Math.random() * 100),
      timestamp: new Date(Date.now() - i * 3600000).toISOString()
    }));
  }

  generateMockCurrencyRates() {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD'];
    const rates = {};
    currencies.forEach(from => {
      rates[from] = {};
      currencies.forEach(to => {
        if (from !== to) {
          rates[from][to] = Math.random() * 2 + 0.5;
        }
      });
    });
    return { rates, timestamp: new Date().toISOString() };
  }

  generateMockCommodityPrices() {
    const commodities = ['Gold', 'Silver', 'Oil', 'Natural Gas', 'Copper'];
    return commodities.map(name => ({
      name,
      price: Math.random() * 1000 + 50,
      change: (Math.random() - 0.5) * 10,
      unit: ['per ounce', 'per barrel', 'per pound'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }));
  }

  generateMockInterestRates() {
    return {
      federal_reserve: (Math.random() * 5).toFixed(2),
      ecb: (Math.random() * 5).toFixed(2),
      bank_of_england: (Math.random() * 5).toFixed(2),
      bank_of_japan: (Math.random() * 1).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  generateMockBitcoinPrice() {
    return {
      bpi: {
        USD: {
          code: 'USD',
          rate: `$${(Math.random() * 10000 + 30000).toFixed(2)}`,
          description: 'United States Dollar'
        }
      },
      time: {
        updated: new Date().toISOString()
      }
    };
  }

  generateMockEthereumPrice() {
    return {
      price: Math.random() * 1000 + 2000,
      change_24h: (Math.random() - 0.5) * 10,
      market_cap: Math.random() * 500000000000,
      timestamp: new Date().toISOString()
    };
  }

  generateMockSocialMediaTrends() {
    const platforms = ['Twitter', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn'];
    return platforms.map(platform => ({
      platform,
      trending_hashtags: [`#${platform}Trend`, `#Viral${platform}`, `#${platform}Challenge`],
      active_users: Math.floor(Math.random() * 1000000000),
      engagement_rate: (Math.random() * 10).toFixed(2),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockYouTubeTrending() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Trending Video ${i + 1}`,
      channel: `Channel ${i + 1}`,
      views: Math.floor(Math.random() * 10000000),
      likes: Math.floor(Math.random() * 1000000),
      upload_date: new Date(Date.now() - i * 86400000).toISOString(),
      thumbnail: `https://picsum.photos/320/180?random=${i + 200}`
    }));
  }

  generateMockTwitterTrends() {
    return Array.from({ length: 10 }, (_, i) => ({
      hashtag: `#Trending${i + 1}`,
      tweets: Math.floor(Math.random() * 1000000),
      location: ['Global', 'US', 'UK', 'India', 'Japan'][Math.floor(Math.random() * 5)],
      timestamp: new Date().toISOString()
    }));
  }

  generateMockRedditTrending() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Reddit Post ${i + 1}`,
      subreddit: `r/subreddit${i + 1}`,
      score: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 1000),
      url: `https://reddit.com/r/subreddit${i + 1}/post${i + 1}`,
      author: `user${i + 1}`
    }));
  }

  generateMockGitHubTrending() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `awesome-project-${i + 1}`,
      description: `A trending open source project in category ${i + 1}`,
      stars: Math.floor(Math.random() * 10000),
      language: ['JavaScript', 'Python', 'Go', 'Rust', 'TypeScript'][Math.floor(Math.random() * 5)],
      url: `https://github.com/user/awesome-project-${i + 1}`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockHackerNews() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Hacker News Story ${i + 1}`,
      url: `https://example.com/story${i + 1}`,
      points: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      author: `user${i + 1}`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockProductHunt() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Product ${i + 1}`,
      tagline: `The best product for ${['productivity', 'design', 'development', 'marketing', 'sales'][i % 5]}`,
      votes: Math.floor(Math.random() * 1000),
      category: ['Tech', 'Design', 'Marketing', 'Productivity', 'AI'][Math.floor(Math.random() * 5)],
      url: `https://producthunt.com/posts/product-${i + 1}`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockSteamGames() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Game ${i + 1}`,
      price: `$${(Math.random() * 60 + 10).toFixed(2)}`,
      discount: Math.floor(Math.random() * 75),
      rating: (Math.random() * 5).toFixed(1),
      players: Math.floor(Math.random() * 100000),
      release_date: new Date(2020 - i, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0]
    }));
  }

  generateMockAmazonBestSellers() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Bestseller Product ${i + 1}`,
      category: ['Electronics', 'Books', 'Home', 'Clothing', 'Sports'][Math.floor(Math.random() * 5)],
      price: `$${(Math.random() * 200 + 20).toFixed(2)}`,
      rating: (Math.random() * 5).toFixed(1),
      reviews: Math.floor(Math.random() * 10000),
      rank: i + 1
    }));
  }

  generateMockFlightStatus() {
    const airlines = ['Delta', 'American', 'United', 'Southwest', 'JetBlue'];
    return airlines.map(airline => ({
      airline,
      flight_number: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9999)}`,
      status: ['On Time', 'Delayed', 'Cancelled', 'Boarding'][Math.floor(Math.random() * 4)],
      departure: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      arrival: new Date(Date.now() + Math.random() * 172800000).toISOString(),
      gate: `${Math.floor(Math.random() * 20) + 1}${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}`
    }));
  }

  generateMockTrafficUpdates() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    return cities.map(city => ({
      city,
      congestion_level: ['Low', 'Moderate', 'High', 'Severe'][Math.floor(Math.random() * 4)],
      average_speed: Math.floor(Math.random() * 40 + 20),
      incidents: Math.floor(Math.random() * 10),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockRestaurantDeals() {
    const restaurants = ['Pizza Palace', 'Burger Barn', 'Sushi Station', 'Taco Town', 'Pasta Palace'];
    return restaurants.map(restaurant => ({
      restaurant,
      deal: `${Math.floor(Math.random() * 50) + 10}% off`,
      cuisine: ['Italian', 'American', 'Japanese', 'Mexican', 'Chinese'][Math.floor(Math.random() * 5)],
      rating: (Math.random() * 5).toFixed(1),
      expires: new Date(Date.now() + Math.random() * 604800000).toISOString()
    }));
  }

  generateMockHotelBookings() {
    const cities = ['Paris', 'London', 'Tokyo', 'New York', 'Dubai'];
    return cities.map(city => ({
      city,
      hotel: `Hotel ${city}`,
      price: `$${Math.floor(Math.random() * 500 + 100)}`,
      rating: (Math.random() * 5).toFixed(1),
      availability: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockJobListings() {
    const titles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Marketing Manager'];
    return titles.map(title => ({
      title,
      company: `Company ${Math.floor(Math.random() * 100)}`,
      salary: `$${Math.floor(Math.random() * 100000 + 50000)} - $${Math.floor(Math.random() * 200000 + 100000)}`,
      location: ['Remote', 'New York', 'San Francisco', 'Austin', 'Seattle'][Math.floor(Math.random() * 5)],
      posted: new Date(Date.now() - Math.random() * 604800000).toISOString(),
      type: ['Full-time', 'Part-time', 'Contract', 'Internship'][Math.floor(Math.random() * 4)]
    }));
  }

  generateMockOnlineCourses() {
    const subjects = ['Python', 'JavaScript', 'Machine Learning', 'Data Science', 'Web Development'];
    return subjects.map(subject => ({
      title: `${subject} Masterclass`,
      platform: ['Coursera', 'Udemy', 'edX', 'Pluralsight', 'LinkedIn Learning'][Math.floor(Math.random() * 5)],
      price: `$${Math.floor(Math.random() * 200 + 50)}`,
      rating: (Math.random() * 5).toFixed(1),
      duration: `${Math.floor(Math.random() * 40 + 10)} hours`,
      students: Math.floor(Math.random() * 100000)
    }));
  }

  generateMockGDPData() {
    return {
      countries: ['USA', 'China', 'Japan', 'Germany', 'UK'].map(country => ({
        country,
        gdp: Math.floor(Math.random() * 20000000000000),
        growth_rate: (Math.random() * 10 - 5).toFixed(2),
        timestamp: new Date().toISOString()
      }))
    };
  }

  generateMockTradeBalance() {
    return {
      countries: ['USA', 'China', 'Germany', 'Japan', 'UK'].map(country => ({
        country,
        exports: Math.floor(Math.random() * 1000000000000),
        imports: Math.floor(Math.random() * 1000000000000),
        balance: Math.floor(Math.random() * 100000000000 - 50000000000),
        timestamp: new Date().toISOString()
      }))
    };
  }

  generateMockOilPrices() {
    return {
      brent: (Math.random() * 50 + 50).toFixed(2),
      wti: (Math.random() * 50 + 40).toFixed(2),
      change: (Math.random() - 0.5) * 10,
      timestamp: new Date().toISOString()
    };
  }

  generateMockGoldPrices() {
    return {
      price: (Math.random() * 500 + 1500).toFixed(2),
      change: (Math.random() - 0.5) * 50,
      currency: 'USD',
      timestamp: new Date().toISOString()
    };
  }

  generateMockSilverPrices() {
    return {
      price: (Math.random() * 10 + 15).toFixed(2),
      change: (Math.random() - 0.5) * 2,
      currency: 'USD',
      timestamp: new Date().toISOString()
    };
  }

  generateMockNFTTrends() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `NFT Collection ${i + 1}`,
      floor_price: Math.floor(Math.random() * 10 + 1),
      volume_24h: Math.floor(Math.random() * 1000000),
      owners: Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockAppStoreTrending() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `App ${i + 1}`,
      category: ['Games', 'Productivity', 'Social', 'Education', 'Entertainment'][Math.floor(Math.random() * 5)],
      rating: (Math.random() * 5).toFixed(1),
      downloads: Math.floor(Math.random() * 10000000),
      rank: i + 1
    }));
  }

  generateMockGooglePlayTrending() {
    return this.generateMockAppStoreTrending();
  }

  generateMockEpicGames() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Game ${i + 1}`,
      price: `$${(Math.random() * 60 + 10).toFixed(2)}`,
      discount: Math.floor(Math.random() * 75),
      rating: (Math.random() * 5).toFixed(1),
      release_date: new Date(2020 - i, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0]
    }));
  }

  generateMockEbayTrending() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Item ${i + 1}`,
      category: ['Electronics', 'Collectibles', 'Fashion', 'Home', 'Sports'][Math.floor(Math.random() * 5)],
      price: `$${(Math.random() * 500 + 20).toFixed(2)}`,
      bids: Math.floor(Math.random() * 50),
      time_left: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
    }));
  }

  generateMockTravelAdvisories() {
    const countries = ['USA', 'Canada', 'UK', 'France', 'Japan'];
    return countries.map(country => ({
      country,
      advisory: ['Exercise normal precautions', 'Exercise increased caution', 'Reconsider travel', 'Do not travel'][Math.floor(Math.random() * 4)],
      level: Math.floor(Math.random() * 4) + 1,
      updated: new Date().toISOString()
    }));
  }

  generateMockVisaRequirements() {
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany'];
    return countries.map(country => ({
      country,
      visa_required: Math.random() > 0.5,
      processing_time: `${Math.floor(Math.random() * 30 + 1)} days`,
      fee: `$${Math.floor(Math.random() * 200 + 50)}`,
      updated: new Date().toISOString()
    }));
  }

  generateMockBankInterestRates() {
    return {
      savings: (Math.random() * 5).toFixed(2),
      checking: (Math.random() * 1).toFixed(2),
      cd_1year: (Math.random() * 6).toFixed(2),
      mortgage_30year: (Math.random() * 4 + 3).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  generateMockCreditCardOffers() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Card ${i + 1}`,
      issuer: ['Chase', 'Bank of America', 'Citi', 'Wells Fargo', 'American Express'][Math.floor(Math.random() * 5)],
      apr: (Math.random() * 20 + 10).toFixed(1),
      rewards: ['Cash Back', 'Travel', 'Points', 'Miles'][Math.floor(Math.random() * 4)],
      annual_fee: `$${Math.floor(Math.random() * 500)}`
    }));
  }

  generateMockLoanRates() {
    return {
      personal: (Math.random() * 15 + 5).toFixed(2),
      auto: (Math.random() * 10 + 3).toFixed(2),
      home_equity: (Math.random() * 8 + 4).toFixed(2),
      student: (Math.random() * 12 + 2).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  generateMockInsuranceRates() {
    return {
      auto: (Math.random() * 2000 + 500).toFixed(0),
      home: (Math.random() * 3000 + 1000).toFixed(0),
      health: (Math.random() * 1000 + 200).toFixed(0),
      life: (Math.random() * 500 + 100).toFixed(0),
      timestamp: new Date().toISOString()
    };
  }

  generateMockRealEstatePrices() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    return cities.map(city => ({
      city,
      median_price: Math.floor(Math.random() * 1000000 + 200000),
      price_change: (Math.random() * 20 - 10).toFixed(1),
      inventory: Math.floor(Math.random() * 10000),
      days_on_market: Math.floor(Math.random() * 100 + 10),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockRentalPrices() {
    const cities = ['New York', 'San Francisco', 'Boston', 'Washington DC', 'Seattle'];
    return cities.map(city => ({
      city,
      avg_rent_1br: Math.floor(Math.random() * 3000 + 1000),
      avg_rent_2br: Math.floor(Math.random() * 4000 + 1500),
      vacancy_rate: (Math.random() * 10).toFixed(1),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockMortgageRates() {
    return {
      '30_year_fixed': (Math.random() * 3 + 3).toFixed(2),
      '15_year_fixed': (Math.random() * 2 + 2.5).toFixed(2),
      '5_1_arm': (Math.random() * 2 + 2).toFixed(2),
      'fha_30_year': (Math.random() * 2 + 2.5).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  generateMockSalaryData() {
    const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Marketing Manager'];
    return roles.map(role => ({
      role,
      avg_salary: Math.floor(Math.random() * 100000 + 50000),
      median_salary: Math.floor(Math.random() * 90000 + 45000),
      entry_level: Math.floor(Math.random() * 60000 + 40000),
      senior_level: Math.floor(Math.random() * 150000 + 80000),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockSkillTrends() {
    const skills = ['Python', 'React', 'Machine Learning', 'AWS', 'Docker'];
    return skills.map(skill => ({
      skill,
      demand: Math.floor(Math.random() * 100),
      growth: (Math.random() * 50).toFixed(1),
      avg_salary: Math.floor(Math.random() * 50000 + 75000),
      timestamp: new Date().toISOString()
    }));
  }

  generateMockCertificationTrends() {
    const certs = ['AWS Certified', 'PMP', 'CISSP', 'Google Cloud', 'Microsoft Azure'];
    return certs.map(cert => ({
      certification: cert,
      avg_salary_increase: Math.floor(Math.random() * 20000 + 5000),
      popularity: Math.floor(Math.random() * 100),
      cost: `$${Math.floor(Math.random() * 500 + 100)}`,
      timestamp: new Date().toISOString()
    }));
  }

  generateMockWebinars() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Webinar ${i + 1}`,
      topic: ['Technology', 'Business', 'Marketing', 'Design', 'Finance'][Math.floor(Math.random() * 5)],
      speaker: `Speaker ${i + 1}`,
      date: new Date(Date.now() + i * 86400000).toISOString(),
      duration: `${Math.floor(Math.random() * 2 + 1)} hours`,
      registration: `https://webinar${i + 1}.com/register`
    }));
  }

  generateMockConferences() {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Conference ${i + 1}`,
      location: ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo'][Math.floor(Math.random() * 5)],
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      attendees: Math.floor(Math.random() * 10000),
      price: `$${Math.floor(Math.random() * 2000 + 200)}`,
      website: `https://conference${i + 1}.com`
    }));
  }

  generateMockResearchPapers() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Research Paper ${i + 1}`,
      authors: [`Author ${i + 1}`, `Co-author ${i + 1}`],
      journal: ['Nature', 'Science', 'Cell', 'PNAS', 'PLOS ONE'][Math.floor(Math.random() * 5)],
      citations: Math.floor(Math.random() * 1000),
      publication_date: new Date(2020 - i, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      doi: `10.1000/paper${i + 1}`
    }));
  }

  generateMockPatentFilings() {
    return Array.from({ length: 10 }, (_, i) => ({
      title: `Patent ${i + 1}`,
      inventor: `Inventor ${i + 1}`,
      assignee: `Company ${i + 1}`,
      filing_date: new Date(2020 - i, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      status: ['Pending', 'Granted', 'Published', 'Abandoned'][Math.floor(Math.random() * 4)],
      classification: ['Technology', 'Medical', 'Mechanical', 'Chemical', 'Electrical'][Math.floor(Math.random() * 5)]
    }));
  }

  generateMockInflationData() {
    return {
      countries: ['USA', 'UK', 'Germany', 'Japan', 'Canada'].map(country => ({
        country,
        rate: (Math.random() * 10).toFixed(1),
        change: (Math.random() - 0.5) * 2,
        timestamp: new Date().toISOString()
      }))
    };
  }

  generateMockUnemploymentData() {
    return {
      countries: ['USA', 'UK', 'Germany', 'Japan', 'Canada'].map(country => ({
        country,
        rate: (Math.random() * 15).toFixed(1),
        change: (Math.random() - 0.5) * 2,
        timestamp: new Date().toISOString()
      }))
    };
  }

  generateGenericMockData(category) {
    return {
      category,
      data: `Mock data for ${category}`,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
  }

  async getData(category) {
    const cached = this.cache.get(category);
    
    if (cached && (Date.now() - cached.timestamp) < this.updateInterval) {
      return cached.data;
    }
    
    if (this.data[category]) {
      return this.data[category];
    }
    
    // If no data exists, fetch it
    await this.fetchCategoryData(category);
    return this.data[category] || this.generateMockData(category);
  }

  getAllData() {
    return this.data;
  }

  getAvailableCategories() {
    return this.getCategories();
  }
}

module.exports = LiveDataService;