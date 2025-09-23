# Complete Django-Style API Integration for VoicePackBackend

## 🚀 Overview

Your existing Node.js/Express `voicepackbackend` has been enhanced with Django-style educational platform APIs while maintaining all original live data functionality. This creates a hybrid backend that serves both educational features and comprehensive live data.

## 📋 What's New

### Django-Style Educational APIs
- **Authentication**: User registration and login with JWT
- **Courses**: Browse, search, and view course details
- **Exams**: Take exams and submit answers
- **Flashcards**: Study with flashcards and track progress
- **Payments**: Process payments and verify transactions
- **Feedback**: Submit and view course feedback

### Live Data Integration
- **Django-style live endpoints**: Weather, news, sports, trending, courses
- **Original 50+ categories**: Maintained with real-time updates
- **Unified caching**: Redis-based caching for all endpoints
- **WebSocket support**: Real-time updates for live data

## 🏗️ Architecture

```
voicepackbackend/
├── server.js                    # Main Express server
├── routes/
│   └── liveData.js             # Combined API routes
├── services/
│   └── LiveDataService.js      # Enhanced with Django providers
├── flutter_client_integration.dart    # Flutter service
├── example_flutter_app.dart         # Complete Flutter example
├── DJANGO_INTEGRATION_GUIDE.md      # Integration guide
└── .env                        # Updated with Django configs
```

## 🔧 Backend Setup

### 1. Environment Configuration
Your `.env` file now includes Django-style configurations:

```env
# Django-style settings
DEBUG=true
SECRET_KEY=your-secret-key-change-this
ALLOWED_HOSTS=*
CORS_ALLOW_ALL=true

# Live data API keys (add your real keys)
NEWS_API_KEY=your-news-api-key
OPENWEATHER_API_KEY=your-weather-api-key
ALPHAVANTAGE_API_KEY=your-stock-api-key
COINMARKETCAP_API_KEY=your-crypto-api-key
TMDB_API_KEY=your-movie-api-key

# Database and cache
REDIS_URL=redis://localhost:6379/0

# Default location for weather/sports
DEFAULT_CITY=Hyderabad
DEFAULT_LAT=17.3850
DEFAULT_LON=78.4867
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Services
```bash
# Start Redis (if using)
redis-server

# Start the backend
npm start
```

### 4. Verify Endpoints
```bash
# Test Django-style endpoints
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/live/weather
curl http://localhost:3000/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Test original live data endpoints
curl http://localhost:3000/api/live-data/categories
curl http://localhost:3000/api/live-data/weather
```

## 📱 Flutter Client Setup

### 1. Create Flutter Project
```bash
flutter create edulive_app
cd edulive_app
```

### 2. Add Dependencies
Add to `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.3.2
```

### 3. Copy Integration Files
```bash
# Copy from your backend project to Flutter project
cp ../voicepackbackend/flutter_client_integration.dart lib/services/
cp ../voicepackbackend/example_flutter_app.dart lib/
```

### 4. Update Main App
Replace `lib/main.dart` with the example app content.

### 5. Configure API URL
Update `lib/services/flutter_client_integration.dart`:
```dart
static const String baseUrl = 'http://your-server-ip:3000/api';
```

### 6. Run the App
```bash
flutter run
```

## 🎯 API Endpoints Reference

### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string"
}

POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Courses
```http
GET /api/courses?search=flutter&category=mobile&level=beginner
GET /api/courses/{id}
```

### Exams
```http
GET /api/exams?course_id=1&status=active
POST /api/exams/{id}/submit
Content-Type: application/json

{
  "answers": [
    {"question_id": 1, "answer": "A"},
    {"question_id": 2, "answer": "B"}
  ]
}
```

### Live Data (Django-style)
```http
GET /api/live/weather
GET /api/live/news
GET /api/live/sports
GET /api/live/trending
GET /api/live/courses
GET /api/live/all
```

### Original Live Data (50+ categories)
```http
GET /api/live-data/categories
GET /api/live-data/{category}
```

## 💡 Usage Examples

### Complete Flutter Integration
```dart
import 'services/api_service.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> courses = [];
  Map<String, dynamic>? weatherData;

  @override
  void initState() {
    super.initState();
    ApiService.setupInterceptors();
    loadData();
  }

  Future<void> loadData() async {
    try {
      // Load educational content
      final courseData = await ApiService.getCourses();
      
      // Load live data
      final weather = await ApiService.getLiveWeather();
      
      setState(() {
        courses = courseData;
        weatherData = weather;
      });
    } catch (e) {
      print('Error loading data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('EduLive')),
      body: Column(
        children: [
          // Weather widget
          if (weatherData != null)
            Card(
              child: ListTile(
                title: Text('Current Weather'),
                subtitle: Text('${weatherData!['temperature']}°C'),
              ),
            ),
          
          // Courses list
          Expanded(
            child: ListView.builder(
              itemCount: courses.length,
              itemBuilder: (context, index) {
                final course = courses[index];
                return Card(
                  child: ListTile(
                    title: Text(course['title']),
                    subtitle: Text(course['description']),
                    trailing: Text('\$${course['price']}'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

### Backend Service Usage
```javascript
// In your Node.js backend, you can now use both APIs
const express = require('express');
const app = express();

// Original live data route
app.get('/api/live-data/weather', async (req, res) => {
  const data = await liveDataService.getWeatherData();
  res.json(data);
});

// New Django-style route
app.get('/api/live/weather', async (req, res) => {
  const data = await liveDataService.fetchDjangoWeatherData();
  res.json({ success: true, data });
});

// Educational route
app.get('/api/courses', async (req, res) => {
  const courses = await getCourses(req.query);
  res.json({ success: true, results: courses });
});
```

## 🔍 Error Handling

### Backend Error Responses
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

### Flutter Error Handling
```dart
try {
  final courses = await ApiService.getCourses();
  // Process data
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    // Redirect to login
  } else if (e.response?.statusCode == 404) {
    // Show "not found" message
  } else {
    // Show generic error
  }
} catch (e) {
  // Handle other exceptions
}
```

## ⚡ Performance Features

### Caching Strategy
- **Redis caching** for all live data endpoints
- **15-minute refresh intervals** for live data
- **Configurable cache TTL** per category

### Rate Limiting
- **API rate limiting** to prevent abuse
- **Configurable limits** per endpoint
- **IP-based tracking**

### Connection Optimization
- **Connection pooling** for database
- **Keep-alive connections** for external APIs
- **Request batching** where possible

## 🔒 Security Features

### Authentication
- **JWT-based authentication**
- **Token expiration** (12 hours default)
- **Secure password hashing**

### API Security
- **CORS protection**
- **Input validation** and sanitization
- **Rate limiting** per IP
- **HTTPS support** (configure in production)

### Data Protection
- **Environment variable** for sensitive data
- **No hardcoded API keys** in code
- **Secure headers** (Helmet.js)

## 🚀 Deployment

### Production Checklist
1. **Environment Variables**: Set production API keys
2. **Database**: Use PostgreSQL instead of SQLite
3. **Redis**: Set up Redis cluster for caching
4. **SSL**: Enable HTTPS with proper certificates
5. **Rate Limiting**: Adjust limits for production load
6. **Monitoring**: Set up logging and monitoring
7. **Backup**: Implement database backup strategy

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 📊 Monitoring and Debugging

### Backend Logs
```bash
# View real-time logs
npm start

# Enable debug logging
DEBUG=app:* npm start
```

### API Testing
```bash
# Test all endpoints
npm run test:api

# Load testing
npm run test:load
```

### Flutter Debugging
```dart
// Enable API debugging
ApiService.setupInterceptors(); // This enables request/response logging

// Check network calls in Flutter DevTools
// Monitor performance in Profile mode
```

## 🤝 Contributing

### Adding New Django-style Endpoints
1. Add route in `routes/liveData.js`
2. Add service method in `services/LiveDataService.js`
3. Add Flutter client method in `flutter_client_integration.dart`
4. Update documentation

### Adding New Live Data Categories
1. Add API key to `.env`
2. Add category configuration in `LiveDataService.js`
3. Implement data fetching method
4. Add Flutter integration

## 📞 Support

### Common Issues
1. **CORS errors**: Check `CORS_ALLOW_ALL=true` in `.env`
2. **API key errors**: Verify API keys are correctly set
3. **Redis connection**: Ensure Redis is running
4. **Port conflicts**: Check if port 3000 is available

### Getting Help
1. Check the error logs in your backend console
2. Verify your `.env` configuration
3. Test endpoints using curl or Postman
4. Check Flutter debug output for API call details
5. Review the integration guides provided

---

**🎉 Congratulations!** You now have a powerful hybrid backend that combines Django-style educational APIs with Node.js performance for live data. Your Flutter app can seamlessly integrate both learning features and real-time data updates.

**Next Steps:**
- Customize the Flutter UI to match your brand
- Add more educational features as needed
- Implement push notifications for live updates
- Set up production deployment
- Add analytics and monitoring