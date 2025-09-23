const express = require('express');
const router = express.Router();
const LiveDataService = require('../services/LiveDataService');

const liveDataService = new LiveDataService();

// Django-style API endpoints matching the Flutter URLs class
// Accounts endpoints
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    // Mock registration - in real implementation, use proper auth service
    const user = {
      id: Math.floor(Math.random() * 1000000),
      username,
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      date_joined: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      user,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Mock login - in real implementation, use proper auth service
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({
      user_id: Math.floor(Math.random() * 1000000),
      username,
      exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hours
    }));

    res.json({
      success: true,
      access: token,
      refresh: 'refresh_' + token,
      user: {
        id: Math.floor(Math.random() * 1000000),
        username,
        email: username + '@example.com'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Courses endpoints
router.get('/courses', async (req, res) => {
  try {
    const { search, category, level } = req.query;
    
    // Mock courses data
    const courses = [
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
        created_at: '2024-01-15T10:00:00Z'
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
        created_at: '2024-02-01T10:00:00Z'
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
        created_at: '2024-01-20T10:00:00Z'
      }
    ];

    let filteredCourses = courses;
    
    if (search) {
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category) {
      filteredCourses = filteredCourses.filter(course => course.category === category);
    }
    
    if (level) {
      filteredCourses = filteredCourses.filter(course => course.level === level);
    }

    res.json({
      success: true,
      count: filteredCourses.length,
      results: filteredCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock course detail
    const course = {
      id: parseInt(id),
      title: 'Introduction to Web Development',
      description: 'Learn the basics of HTML, CSS, and JavaScript',
      category: 'programming',
      level: 'beginner',
      duration: '4 weeks',
      price: 49.99,
      rating: 4.5,
      instructor: 'John Doe',
      curriculum: [
        { week: 1, topic: 'HTML Basics', completed: false },
        { week: 2, topic: 'CSS Fundamentals', completed: false },
        { week: 3, topic: 'JavaScript Introduction', completed: false },
        { week: 4, topic: 'Building Your First Website', completed: false }
      ],
      reviews: [
        { user: 'Alice', rating: 5, comment: 'Great course!', date: '2024-01-20' },
        { user: 'Bob', rating: 4, comment: 'Very informative', date: '2024-01-22' }
      ]
    };

    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Exams endpoints
router.get('/exams', async (req, res) => {
  try {
    const { course_id, status } = req.query;
    
    // Mock exams data
    const exams = [
      {
        id: 1,
        title: 'Web Development Basics Quiz',
        course_id: 1,
        duration: 30,
        total_marks: 100,
        passing_marks: 60,
        status: 'active',
        scheduled_date: '2024-03-01T10:00:00Z'
      },
      {
        id: 2,
        title: 'React Advanced Assessment',
        course_id: 2,
        duration: 45,
        total_marks: 100,
        passing_marks: 70,
        status: 'upcoming',
        scheduled_date: '2024-03-15T14:00:00Z'
      }
    ];

    let filteredExams = exams;
    
    if (course_id) {
      filteredExams = filteredExams.filter(exam => exam.course_id === parseInt(course_id));
    }
    
    if (status) {
      filteredExams = filteredExams.filter(exam => exam.status === status);
    }

    res.json({
      success: true,
      count: filteredExams.length,
      results: filteredExams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/exams/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    
    // Mock exam submission
    const result = {
      exam_id: parseInt(id),
      score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      total_marks: 100,
      passed: true,
      answers_reviewed: answers?.length || 0,
      submitted_at: new Date().toISOString()
    };

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Flashcards endpoints
router.get('/flashcards', async (req, res) => {
  try {
    const { course_id, category } = req.query;
    
    // Mock flashcards data
    const flashcards = [
      {
        id: 1,
        question: 'What is HTML?',
        answer: 'HyperText Markup Language - the standard markup language for creating web pages',
        category: 'html',
        course_id: 1,
        difficulty: 'easy'
      },
      {
        id: 2,
        question: 'What is CSS?',
        answer: 'Cascading Style Sheets - used to style and layout web pages',
        category: 'css',
        course_id: 1,
        difficulty: 'easy'
      },
      {
        id: 3,
        question: 'What is React?',
        answer: 'A JavaScript library for building user interfaces',
        category: 'react',
        course_id: 2,
        difficulty: 'medium'
      }
    ];

    let filteredFlashcards = flashcards;
    
    if (course_id) {
      filteredFlashcards = filteredFlashcards.filter(card => card.course_id === parseInt(course_id));
    }
    
    if (category) {
      filteredFlashcards = filteredFlashcards.filter(card => card.category === category);
    }

    res.json({
      success: true,
      count: filteredFlashcards.length,
      results: filteredFlashcards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/flashcards/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { difficulty } = req.body; // easy, medium, hard
    
    // Mock review tracking
    const review = {
      flashcard_id: parseInt(id),
      difficulty: difficulty || 'medium',
      next_review: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // Next review in 24 hours
      reviewed_at: new Date().toISOString()
    };

    res.json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Payments endpoints
router.post('/payments/create', async (req, res) => {
  try {
    const { course_id, amount, currency = 'USD' } = req.body;
    
    if (!course_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and amount are required'
      });
    }

    // Mock payment creation
    const payment = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      course_id: parseInt(course_id),
      amount: parseFloat(amount),
      currency,
      status: 'pending',
      payment_url: 'https://example.com/payment/' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/payments/verify', async (req, res) => {
  try {
    const { payment_id } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    // Mock payment verification
    const verification = {
      payment_id,
      status: 'completed',
      amount: 49.99,
      currency: 'USD',
      verified_at: new Date().toISOString()
    };

    res.json({
      success: true,
      verification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Feedback endpoints
router.post('/feedback', async (req, res) => {
  try {
    const { course_id, rating, comment, type = 'general' } = req.body;
    
    if (!course_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Mock feedback submission
    const feedback = {
      id: Math.floor(Math.random() * 1000000),
      course_id: parseInt(course_id),
      rating: parseInt(rating),
      comment: comment || '',
      type,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/feedback', async (req, res) => {
  try {
    const { course_id } = req.query;
    
    // Mock feedback data
    const feedbacks = [
      {
        id: 1,
        course_id: 1,
        rating: 5,
        comment: 'Excellent course! Very well structured.',
        type: 'general',
        created_at: '2024-01-20T10:00:00Z'
      },
      {
        id: 2,
        course_id: 1,
        rating: 4,
        comment: 'Good content, could use more examples.',
        type: 'general',
        created_at: '2024-01-22T10:00:00Z'
      }
    ];

    let filteredFeedbacks = feedbacks;
    
    if (course_id) {
      filteredFeedbacks = filteredFeedbacks.filter(feedback => feedback.course_id === parseInt(course_id));
    }

    const averageRating = filteredFeedbacks.length > 0 
      ? filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length 
      : 0;

    res.json({
      success: true,
      count: filteredFeedbacks.length,
      average_rating: Math.round(averageRating * 10) / 10,
      results: filteredFeedbacks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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