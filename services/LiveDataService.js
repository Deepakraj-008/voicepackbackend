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

  // Django-style provider methods matching the specifications
  async fetchDjangoWeatherData() {
    try {
      const city = process.env.DEFAULT_CITY || 'Hyderabad';
      const lat = process.env.DEFAULT_LAT || '17.3850';
      const lon = process.env.DEFAULT_LON || '78.4867';
      
      if (this.apiKeys.weather && this.apiKeys.weather !== 'demo') {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            lat,
            lon,
            appid: this.apiKeys.weather,
            units: 'metric'
          }
        });
        
        return {
          city: response.data.name,
          temperature: response.data.main.temp,
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          wind_speed: response.data.wind.speed,
          icon: response.data.weather[0].icon,
          timestamp: new Date().toISOString()
        };
      }
      
      // Mock data for demo
      return {
        city: city,
        temperature: 28 + Math.floor(Math.random() * 10),
        description: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: 60 + Math.floor(Math.random() * 20),
        wind_speed: (Math.random() * 10 + 5).toFixed(1),
        icon: '01d',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.generateMockWeatherData();
    }
  }

  async fetchDjangoNewsData() {
    try {
      if (this.apiKeys.news && this.apiKeys.news !== 'demo') {
        const response = await axios.get(process.env.NEWS_API_URL || 'https://newsapi.org/v2/top-headlines', {
          params: {
            country: 'in',
            apiKey: this.apiKeys.news,
            pageSize: 10
          }
        });
        
        return response.data.articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source.name
        }));
      }
      
      // Mock news data
      return this.generateMockNewsData();
    } catch (error) {
      console.error('News API error:', error.message);
      return this.generateMockNewsData();
    }
  }

  async fetchDjangoSportsData() {
    try {
      if (process.env.SPORTS_SCOREBOARD_URL) {
        const response = await axios.get(process.env.SPORTS_SCOREBOARD_URL);
        
        return {
          events: response.data.events?.slice(0, 5).map(event => ({
            name: event.name,
            date: event.date,
            status: event.status,
            competitors: event.competitions?.[0]?.competitors?.map(competitor => ({
              name: competitor.team.displayName,
              score: competitor.score
            })) || []
          })) || [],
          timestamp: new Date().toISOString()
        };
      }
      
      // Mock sports data
      return this.generateMockSportsData();
    } catch (error) {
      console.error('Sports API error:', error.message);
      return this.generateMockSportsData();
    }
  }

  async fetchDjangoTrendingData() {
    try {
      // Combine multiple trending sources
      const [twitterTrends, youtubeTrending, redditTrends] = await Promise.all([
        this.fetchTwitterTrends(),
        this.fetchYouTubeTrending(),
        this.fetchRedditTrends()
      ]);
      
      return {
        twitter: twitterTrends.slice(0, 5),
        youtube: youtubeTrending.slice(0, 5),
        reddit: redditTrends.slice(0, 5),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Trending data error:', error.message);
      return {
        twitter: this.generateMockTwitterTrends().slice(0, 5),
        youtube: this.generateMockYouTubeTrending().slice(0, 5),
        reddit: this.generateMockRedditTrends().slice(0, 5),
        timestamp: new Date().toISOString()
      };
    }
  }

  async fetchDjangoCoursesData() {
    try {
      // Mock courses data that matches Django structure
      return [
        {
          id: 1,
          title: 'Introduction to Web Development',
          description: 'Learn the basics of HTML, CSS, and JavaScript',
          category: 'programming',
          level: 'beginner',
          duration: '4 weeks',
          price: 49.99,
          rating: 4.5,
          instructor: 'John Doe',
          created_at: '2024-01-15T10:00:00Z',
          curriculum: [
            { week: 1, topic: 'HTML Basics', completed: false },
            { week: 2, topic: 'CSS Fundamentals', completed: false },
            { week: 3, topic: 'JavaScript Introduction', completed: false },
            { week: 4, topic: 'Building Your First Website', completed: false }
          ]
        },
        {
          id: 2,
          title: 'Advanced React Development',
          description: 'Master React hooks, context, and advanced patterns',
          category: 'programming',
          level: 'advanced',
          duration: '6 weeks',
          price: 89.99,
          rating: 4.8,
          instructor: 'Jane Smith',
          created_at: '2024-02-01T10:00:00Z',
          curriculum: [
            { week: 1, topic: 'React Hooks Deep Dive', completed: false },
            { week: 2, topic: 'Context and State Management', completed: false },
            { week: 3, topic: 'Advanced Patterns', completed: false },
            { week: 4, topic: 'Performance Optimization', completed: false },
            { week: 5, topic: 'Testing Strategies', completed: false },
            { week: 6, topic: 'Deployment Best Practices', completed: false }
          ]
        },
        {
          id: 3,
          title: 'Digital Marketing Fundamentals',
          description: 'Learn SEO, social media marketing, and analytics',
          category: 'marketing',
          level: 'beginner',
          duration: '3 weeks',
          price: 39.99,
          rating: 4.3,
          instructor: 'Mike Johnson',
          created_at: '2024-01-20T10:00:00Z',
          curriculum: [
            { week: 1, topic: 'SEO Basics', completed: false },
            { week: 2, topic: 'Social Media Strategy', completed: false },
            { week: 3, topic: 'Analytics and Measurement', completed: false }
          ]
        }
      ];
    } catch (error) {
      console.error('Courses data error:', error.message);
      return this.generateMockCoursesData();
    }
  }

  // AI-related data fetching methods
  async fetchAITrendingModels() {
    try {
      // Hugging Face trending models
      const response = await axios.get('https://huggingface.co/api/trending', {
        timeout: 10000,
        headers: { 'User-Agent': 'AI-Hub-Client/1.0' }
      });
      
      const models = response.data.models || [];
      return models.slice(0, 8).map(model => ({
        id: model.id,
        name: model.name,
        description: model.description || 'No description available',
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        tags: model.tags || [],
        last_updated: model.last_modified,
        trending_score: (model.downloads || 0) + (model.likes || 0) * 10
      }));
    } catch (error) {
      console.error('AI models fetch error:', error.message);
      return this.generateMockAIModels();
    }
  }

  async fetchAIDatasets() {
    try {
      // Hugging Face datasets
      const response = await axios.get('https://huggingface.co/api/datasets?sort=downloads&direction=-1&limit=10', {
        timeout: 10000,
        headers: { 'User-Agent': 'AI-Hub-Client/1.0' }
      });
      
      const datasets = response.data || [];
      return datasets.slice(0, 8).map(dataset => ({
        id: dataset.id,
        name: dataset.name,
        description: dataset.description || 'No description available',
        downloads: dataset.downloads || 0,
        likes: dataset.likes || 0,
        tags: dataset.tags || [],
        size: dataset.size || 'Unknown',
        last_updated: dataset.last_modified
      }));
    } catch (error) {
      console.error('AI datasets fetch error:', error.message);
      return this.generateMockAIDatasets();
    }
  }

  async fetchAIPapers() {
    try {
      // arXiv API for AI papers
      const query = 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV';
      const response = await axios.get(`http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`, {
        timeout: 15000,
        headers: { 'User-Agent': 'AI-Hub-Client/1.0' }
      });
      
      // Parse arXiv XML response
      const xmlData = response.data;
      const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      
      return entries.slice(0, 6).map(entry => {
        const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || 'No title';
        const authors = (entry.match(/<name>([\s\S]*?)<\/name>/g) || []).map(a => a.replace(/<\/?name>/g, ''));
        const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim() || 'No summary';
        const published = (entry.match(/<published>([\s\S]*?)<\/published>/) || [])[1] || '';
        const id = (entry.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || '';
        
        return {
          id: id.split('/').pop(),
          title: title.replace(/\n/g, ' '),
          authors: authors,
          summary: summary.replace(/\n/g, ' ').substring(0, 200) + '...',
          published: published,
          category: 'AI/ML',
          arxiv_url: id
        };
      });
    } catch (error) {
      console.error('AI papers fetch error:', error.message);
      return this.generateMockAIPapers();
    }
  }

  async fetchAINews() {
    try {
      let articles = [];
      
      // Try NewsAPI first if key is available
      if (this.apiKeys.news && this.apiKeys.news !== 'demo') {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: 'artificial intelligence OR machine learning OR AI',
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 8
          },
          headers: { 'X-API-Key': this.apiKeys.news },
          timeout: 10000
        });
        
        articles = response.data.articles || [];
      } else {
        // Fallback to RSS feeds
        const rssFeeds = [
          'https://feeds.feedburner.com/ai-blog',
          'https://venturebeat.com/ai/feed/',
          'https://www.artificialintelligence-news.com/feed/'
        ];
        
        // Mock fallback data
        articles = this.generateMockAINews();
      }
      
      return articles.slice(0, 6).map(article => ({
        id: article.url ? Buffer.from(article.url).toString('base64').substring(0, 10) : Math.random().toString(36).substr(2, 9),
        title: article.title || 'No title',
        description: article.description || article.summary || 'No description',
        url: article.url || '#',
        publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
        source: article.source?.name || article.source || 'Unknown',
        image: article.urlToImage || article.image || null
      }));
    } catch (error) {
      console.error('AI news fetch error:', error.message);
      return this.generateMockAINews();
    }
  }

  async fetchAICommunity() {
    try {
      // Hacker News AI/ML stories via Algolia API
      const response = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: {
          query: 'artificial intelligence OR machine learning OR AI',
          tags: 'story',
          numericFilters: 'created_at_i>1640995200', // After 2022
          page: 0,
          hitsPerPage: 8
        },
        timeout: 10000
      });
      
      const hits = response.data.hits || [];
      return hits.slice(0, 6).map(hit => ({
        id: hit.objectID,
        title: hit.title,
        url: hit.url,
        author: hit.author,
        points: hit.points,
        comments: hit.num_comments,
        created_at: new Date(hit.created_at).toISOString(),
        story_text: hit.story_text ? hit.story_text.substring(0, 200) + '...' : null
      }));
    } catch (error) {
      console.error('AI community fetch error:', error.message);
      return this.generateMockAICommunity();
    }
  }

  async fetchAIRepos() {
    try {
      // GitHub trending AI/ML repositories
      const query = 'artificial intelligence OR machine learning OR deep learning OR neural network language:Python';
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 8
        },
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        timeout: 10000
      });
      
      const repos = response.data.items || [];
      return repos.slice(0, 6).map(repo => ({
        id: repo.id,
        name: repo.full_name,
        description: repo.description || 'No description',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        topics: repo.topics || []
      }));
    } catch (error) {
      console.error('AI repos fetch error:', error.message);
      return this.generateMockAIRepos();
    }
  }

  async fetchAIDashboard() {
    try {
      const [models, datasets, papers, news, community, repos] = await Promise.all([
        this.fetchAITrendingModels(),
        this.fetchAIDatasets(),
        this.fetchAIPapers(),
        this.fetchAINews(),
        this.fetchAICommunity(),
        this.fetchAIRepos()
      ]);

      return {
        trending_models: models,
        trending_datasets: datasets,
        recent_papers: papers,
        ai_news: news,
        community_posts: community,
        trending_repos: repos,
        last_updated: new Date().toISOString(),
        summary: {
          total_models: models.length,
          total_datasets: datasets.length,
          total_papers: papers.length,
          total_news: news.length,
          total_community_posts: community.length,
          total_repos: repos.length
        }
      };
    } catch (error) {
      console.error('AI dashboard fetch error:', error.message);
      return this.generateMockAIDashboard();
    }
  }

  // Mock data generators for AI features
  generateMockAIModels() {
    const models = [
      { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI\'s most advanced language model', downloads: 5000000, likes: 25000, tags: ['nlp', 'text-generation'] },
      { id: 'stable-diffusion', name: 'Stable Diffusion', description: 'Text-to-image generation model', downloads: 3000000, likes: 18000, tags: ['image-generation', 'diffusion'] },
      { id: 'llama-2', name: 'LLaMA 2', description: 'Meta\'s open source large language model', downloads: 2000000, likes: 15000, tags: ['nlp', 'open-source'] },
      { id: 'whisper', name: 'Whisper', description: 'OpenAI\'s automatic speech recognition', downloads: 1500000, likes: 12000, tags: ['speech', 'asr'] },
      { id: 'clip', name: 'CLIP', description: 'OpenAI\'s vision-language model', downloads: 1000000, likes: 8500, tags: ['vision', 'multimodal'] },
      { id: 'bert', name: 'BERT', description: 'Google\'s bidirectional encoder representations', downloads: 800000, likes: 7000, tags: ['nlp', 'transformer'] },
      { id: 'dall-e', name: 'DALL-E', description: 'OpenAI\'s text-to-image generation', downloads: 600000, likes: 5500, tags: ['image-generation', 'creative'] },
      { id: 'codex', name: 'Codex', description: 'OpenAI\'s code generation model', downloads: 400000, likes: 4000, tags: ['code', 'programming'] }
    ];
    
    return models.map(model => ({
      ...model,
      trending_score: model.downloads + model.likes * 10,
      last_updated: new Date().toISOString()
    }));
  }

  generateMockAIDatasets() {
    const datasets = [
      { id: 'imagenet', name: 'ImageNet', description: 'Large visual database for object recognition', downloads: 1000000, likes: 5000, size: '150GB', tags: ['vision', 'classification'] },
      { id: 'coco', name: 'COCO', description: 'Common Objects in Context dataset', downloads: 500000, likes: 3000, size: '25GB', tags: ['vision', 'detection'] },
      { id: 'openwebtext', name: 'OpenWebText', description: 'Large-scale web text corpus', downloads: 300000, likes: 2000, size: '38GB', tags: ['nlp', 'text'] },
      { id: 'libritts', name: 'LibriTTS', description: 'Text-to-speech dataset', downloads: 200000, likes: 1500, size: '8GB', tags: ['speech', 'tts'] },
      { id: 'wikitext', name: 'WikiText', description: 'Wikipedia-based text dataset', downloads: 150000, likes: 1200, size: '500MB', tags: ['nlp', 'language-modeling'] },
      { id: 'squad', name: 'SQuAD', description: 'Stanford Question Answering Dataset', downloads: 100000, likes: 800, size: '50MB', tags: ['nlp', 'qa'] },
      { id: 'mnist', name: 'MNIST', description: 'Handwritten digit database', downloads: 80000, likes: 600, size: '10MB', tags: ['vision', 'classification'] },
      { id: 'common-voice', name: 'Common Voice', description: 'Mozilla\'s multilingual speech dataset', downloads: 50000, likes: 400, size: '12GB', tags: ['speech', 'multilingual'] }
    ];
    
    return datasets.map(dataset => ({
      ...dataset,
      last_updated: new Date().toISOString()
    }));
  }

  generateMockAIPapers() {
    const papers = [
      { title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'], summary: 'We propose a new simple network architecture, the Transformer...', published: '2017-06-12', category: 'AI/ML' },
      { title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'], summary: 'We introduce a new language representation model called BERT...', published: '2018-10-11', category: 'AI/ML' },
      { title: 'GPT-3: Language Models are Few-Shot Learners', authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder'], summary: 'Recent work has demonstrated substantial gains on many NLP tasks...', published: '2020-05-28', category: 'AI/ML' },
      { title: 'DALL-E: Creating Images from Text', authors: ['Aditya Ramesh', 'Mikhail Pavlov', 'Gabriel Goh'], summary: 'We\'ve trained a neural network called DALL-E that creates images...', published: '2021-01-05', category: 'AI/ML' },
      { title: 'AlphaFold: Protein Structure Prediction', authors: ['John Jumper', 'Richard Evans', 'Alexander Pritzel'], summary: 'We present AlphaFold, a neural network system that predicts protein structures...', published: '2020-11-30', category: 'AI/ML' },
      { title: 'CLIP: Connecting Text and Images', authors: ['Alec Radford', 'Jong Wook Kim', 'Chris Hallacy'], summary: 'We present a neural network that learns visual concepts from natural language...', published: '2021-02-26', category: 'AI/ML' }
    ];
    
    return papers.map((paper, index) => ({
      id: `arxiv.${2024000 + index}`,
      ...paper,
      summary: paper.summary.substring(0, 200) + '...',
      arxiv_url: `https://arxiv.org/abs/${2024000 + index}`,
      published: new Date(paper.published).toISOString()
    }));
  }

  generateMockAINews() {
    const news = [
      { title: 'OpenAI Releases GPT-4 Turbo', description: 'OpenAI announces GPT-4 Turbo with improved capabilities and reduced costs', url: 'https://example.com/gpt4-turbo', source: { name: 'TechCrunch' }, publishedAt: '2024-01-15T10:00:00Z' },
      { title: 'Google Launches Gemini Pro', description: 'Google introduces Gemini Pro, its most capable AI model yet', url: 'https://example.com/gemini-pro', source: { name: 'The Verge' }, publishedAt: '2024-01-14T15:30:00Z' },
      { title: 'Microsoft Copilot Gets Major Update', description: 'Microsoft enhances Copilot with new AI-powered features', url: 'https://example.com/copilot-update', source: { name: 'Wired' }, publishedAt: '2024-01-13T09:15:00Z' },
      { title: 'AI Breakthrough in Drug Discovery', description: 'Researchers use AI to discover new drug compounds for rare diseases', url: 'https://example.com/ai-drug-discovery', source: { name: 'Nature' }, publishedAt: '2024-01-12T14:20:00Z' },
      { title: 'Meta Releases New AI Framework', description: 'Meta open-sources new AI framework for computer vision tasks', url: 'https://example.com/meta-ai', source: { name: 'MIT Technology Review' }, publishedAt: '2024-01-11T11:45:00Z' },
      { title: 'AI Ethics Guidelines Updated', description: 'New guidelines released for ethical AI development and deployment', url: 'https://example.com/ai-ethics', source: { name: 'AI News' }, publishedAt: '2024-01-10T16:00:00Z' }
    ];
    
    return news.map(article => ({
      ...article,
      id: Buffer.from(article.url).toString('base64').substring(0, 10),
      image: null
    }));
  }

  generateMockAICommunity() {
    const posts = [
      { title: 'Show HN: I built an AI-powered code reviewer', url: 'https://news.ycombinator.com/item?id=38912345', author: 'dev123', points: 342, comments: 89, created_at: '2024-01-15T08:30:00Z' },
      { title: 'The Future of AI in Healthcare', url: 'https://example.com/ai-healthcare', author: 'healthtech', points: 256, comments: 67, created_at: '2024-01-14T12:15:00Z' },
      { title: 'Understanding Transformer Architecture', url: 'https://example.com/transformers', author: 'mlresearcher', points: 189, comments: 45, created_at: '2024-01-13T16:45:00Z' },
      { title: 'AI Tools for Content Creation', url: 'https://example.com/ai-content', author: 'contentcreator', points: 134, comments: 23, created_at: '2024-01-12T09:20:00Z' },
      { title: 'Machine Learning in Finance', url: 'https://example.com/ml-finance', author: 'fintech_dev', points: 98, comments: 34, created_at: '2024-01-11T14:10:00Z' },
      { title: 'Building AI Chatbots with Python', url: 'https://example.com/python-chatbots', author: 'python_enthusiast', points: 76, comments: 18, created_at: '2024-01-10T11:30:00Z' }
    ];
    
    return posts.map(post => ({
      ...post,
      id: post.url.split('id=')[1] || Math.random().toString(36).substr(2, 9),
      story_text: post.title.length > 50 ? post.title.substring(0, 200) + '...' : null
    }));
  }

  generateMockAIRepos() {
    const repos = [
      { id: 123456789, name: 'microsoft/DialoGPT', description: 'Large-scale pretrained response generation model', stars: 15432, forks: 2341, language: 'Python', created_at: '2019-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z', topics: ['nlp', 'dialogue', 'transformer'] },
      { id: 234567890, name: 'huggingface/transformers', description: 'State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX', stars: 89234, forks: 18765, language: 'Python', created_at: '2018-10-01T00:00:00Z', updated_at: '2024-01-14T00:00:00Z', topics: ['nlp', 'transformer', 'pytorch'] },
      { id: 345678901, name: 'pytorch/pytorch', description: 'Tensors and Dynamic neural networks in Python with strong GPU acceleration', stars: 76543, forks: 19876, language: 'C++', created_at: '2016-08-01T00:00:00Z', updated_at: '2024-01-13T00:00:00Z', topics: ['deep-learning', 'gpu', 'tensor'] },
      { id: 456789012, name: 'tensorflow/tensorflow', description: 'An Open Source Machine Learning Framework for Everyone', stars: 187654, forks: 98765, language: 'C++', created_at: '2015-11-01T00:00:00Z', updated_at: '2024-01-12T00:00:00Z', topics: ['machine-learning', 'tensorflow', 'neural-network'] },
      { id: 567890123, name: 'openai/baselines', description: 'OpenAI Baselines: high-quality implementations of reinforcement learning algorithms', stars: 12345, forks: 3456, language: 'Python', created_at: '2017-05-01T00:00:00Z', updated_at: '2024-01-11T00:00:00Z', topics: ['reinforcement-learning', 'openai', 'algorithms'] },
      { id: 678901234, name: 'scikit-learn/scikit-learn', description: 'scikit-learn: machine learning in Python', stars: 56789, forks: 23456, language: 'Python', created_at: '2010-06-01T00:00:00Z', updated_at: '2024-01-10T00:00:00Z', topics: ['machine-learning', 'python', 'data-science'] }
    ];
    
    return repos;
  }

  generateMockAIDashboard() {
    return {
      trending_models: this.generateMockAIModels(),
      trending_datasets: this.generateMockAIDatasets(),
      recent_papers: this.generateMockAIPapers(),
      ai_news: this.generateMockAINews(),
      community_posts: this.generateMockAICommunity(),
      trending_repos: this.generateMockAIRepos(),
      last_updated: new Date().toISOString(),
      summary: {
        total_models: 8,
        total_datasets: 8,
        total_papers: 6,
        total_news: 6,
        total_community_posts: 6,
        total_repos: 6
      }
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