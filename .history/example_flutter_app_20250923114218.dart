// Example Flutter App - Complete Integration
// This file shows how to build a Flutter app using both Django-style and Live Data APIs

import 'package:flutter/material.dart';
import 'package:flutter_client_integration.dart';

void main() {
  ApiService.setupInterceptors();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduLive - Learning with Live Data',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  @override
  _AuthWrapperState createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool isLoggedIn = false;
  Map<String, dynamic>? currentUser;

  @override
  void initState() {
    super.initState();
    checkLoginStatus();
  }

  void checkLoginStatus() {
    // Check if user is already logged in (you might store token in SharedPreferences)
    setState(() {
      isLoggedIn = false; // Change based on your auth logic
    });
  }

  void handleLogin(Map<String, dynamic> userData) {
    setState(() {
      currentUser = userData['user'];
      isLoggedIn = true;
    });
  }

  void handleLogout() {
    setState(() {
      currentUser = null;
      isLoggedIn = false;
    });
    ApiService.removeAuthToken();
  }

  @override
  Widget build(BuildContext context) {
    return isLoggedIn
        ? MainScreen(user: currentUser!, onLogout: handleLogout)
        : LoginScreen(onLogin: handleLogin);
  }
}

class LoginScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onLogin;

  LoginScreen({required this.onLogin});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        final userData = await ApiService.login(
          username: _usernameController.text,
          password: _passwordController.text,
        );
        widget.onLogin(userData);
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Login failed: $e')));
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _usernameController,
                decoration: InputDecoration(labelText: 'Username'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),
              SizedBox(height: 20),
              _isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(onPressed: _login, child: Text('Login')),
            ],
          ),
        ),
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final VoidCallback onLogout;

  MainScreen({required this.user, required this.onLogout});

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('EduLive'),
        actions: [
          IconButton(icon: Icon(Icons.logout), onPressed: widget.onLogout),
        ],
      ),
      body: _getBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.school), label: 'Courses'),
          BottomNavigationBarItem(
            icon: Icon(Icons.flash_on),
            label: 'Live Data',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _getBody() {
    switch (_selectedIndex) {
      case 0:
        return CoursesScreen();
      case 1:
        return LiveDataScreen();
      case 2:
        return ProfileScreen(user: widget.user);
      default:
        return CoursesScreen();
    }
  }
}

class CoursesScreen extends StatefulWidget {
  @override
  _CoursesScreenState createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  List<dynamic> courses = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    loadCourses();
  }

  Future<void> loadCourses() async {
    try {
      final data = await ApiService.getCourses();
      setState(() {
        courses = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(child: Text('Error: $error'));
    }

    return ListView.builder(
      itemCount: courses.length,
      itemBuilder: (context, index) {
        final course = courses[index];
        return Card(
          margin: EdgeInsets.all(8.0),
          child: ListTile(
            title: Text(course['title']),
            subtitle: Text(course['description']),
            trailing: Text('\$${course['price']}'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CourseDetailScreen(course: course),
              ),
            ),
          ),
        );
      },
    );
  }
}

class CourseDetailScreen extends StatefulWidget {
  final Map<String, dynamic> course;

  CourseDetailScreen({required this.course});

  @override
  _CourseDetailScreenState createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  Map<String, dynamic>? courseDetail;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadCourseDetail();
  }

  Future<void> loadCourseDetail() async {
    try {
      final detail = await ApiService.getCourseDetail(widget.course['id']);
      setState(() {
        courseDetail = detail;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading course details: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.course['title'])),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : courseDetail == null
          ? Center(child: Text('Failed to load course details'))
          : Padding(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    courseDetail!['title'],
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(courseDetail!['description']),
                  SizedBox(height: 16),
                  Text('Instructor: ${courseDetail!['instructor']}'),
                  Text('Duration: ${courseDetail!['duration']}'),
                  Text('Level: ${courseDetail!['level']}'),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Enroll in course logic
                    },
                    child: Text('Enroll Now - \$${courseDetail!['price']}'),
                  ),
                ],
              ),
            ),
    );
  }
}

class LiveDataScreen extends StatefulWidget {
  @override
  _LiveDataScreenState createState() => _LiveDataScreenState();
}

class _LiveDataScreenState extends State<LiveDataScreen> {
  Map<String, dynamic>? weatherData;
  List<dynamic> newsData = [];
  Map<String, dynamic>? sportsData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadLiveData();
  }

  Future<void> loadLiveData() async {
    try {
      final weather = await ApiService.getLiveWeather();
      final news = await ApiService.getLiveNews();
      final sports = await ApiService.getLiveSports();

      setState(() {
        weatherData = weather;
        newsData = news;
        sportsData = sports;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading live data: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: loadLiveData,
      child: ListView(
        padding: EdgeInsets.all(16.0),
        children: [
          // Weather Section
          if (weatherData != null) ...[
            Text(
              'Weather',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Card(
              child: ListTile(
                title: Text('${weatherData!['city']}'),
                subtitle: Text(
                  '${weatherData!['temperature']}°C - ${weatherData!['description']}',
                ),
                trailing: Icon(Icons.wb_sunny, color: Colors.orange),
              ),
            ),
            SizedBox(height: 16),
          ],

          // News Section
          if (newsData.isNotEmpty) ...[
            Text(
              'Latest News',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            ...newsData
                .take(3)
                .map(
                  (news) => Card(
                    child: ListTile(
                      title: Text(news['title']),
                      subtitle: Text(news['source']),
                      trailing: Text('${news['publishedAt']}'),
                    ),
                  ),
                ),
            SizedBox(height: 16),
          ],

          // Sports Section
          if (sportsData != null && sportsData!['matches'] != null) ...[
            Text(
              'Sports Updates',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            ...(sportsData!['matches'] as List)
                .take(2)
                .map(
                  (match) => Card(
                    child: ListTile(
                      title: Text('${match['team1']} vs ${match['team2']}'),
                      subtitle: Text('${match['status']}'),
                      trailing: Text('${match['score'] ?? 'TBD'}'),
                    ),
                  ),
                ),
          ],
        ],
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  final Map<String, dynamic> user;

  ProfileScreen({required this.user});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person, size: 64),
          SizedBox(height: 16),
          Text('Welcome, ${user['username']}!', style: TextStyle(fontSize: 24)),
          Text('Email: ${user['email']}'),
          SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              // Show original live data categories
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => LiveDataCategoriesScreen(),
                ),
              );
            },
            child: Text('Explore Live Data Categories'),
          ),
        ],
      ),
    );
  }
}

class LiveDataCategoriesScreen extends StatefulWidget {
  @override
  _LiveDataCategoriesScreenState createState() =>
      _LiveDataCategoriesScreenState();
}

class _LiveDataCategoriesScreenState extends State<LiveDataCategoriesScreen> {
  List<dynamic> categories = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadCategories();
  }

  Future<void> loadCategories() async {
    try {
      final data = await ApiService.getLiveDataCategories();
      setState(() {
        categories = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading categories: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Live Data Categories')),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                return ListTile(
                  title: Text(category['name']),
                  subtitle: Text(category['description'] ?? ''),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            LiveDataDetailScreen(category: category['id']),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}

class LiveDataDetailScreen extends StatefulWidget {
  final String category;

  LiveDataDetailScreen({required this.category});

  @override
  _LiveDataDetailScreenState createState() => _LiveDataDetailScreenState();
}

class _LiveDataDetailScreenState extends State<LiveDataDetailScreen> {
  Map<String, dynamic>? data;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final result = await ApiService.getLiveData(widget.category);
      setState(() {
        data = result;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.category)),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : data == null
          ? Center(child: Text('No data available'))
          : SingleChildScrollView(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${widget.category} Data',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 16),
                  // Display data based on category type
                  // This is a generic display - customize based on your data structure
                  Text(
                    data.toString(),
                    style: TextStyle(fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
    );
  }
}

// Usage Instructions:
/*
1. Create a new Flutter project:
   flutter create edulive_app

2. Add dependencies to pubspec.yaml:
   dependencies:
     flutter:
       sdk: flutter
     dio: ^5.3.2

3. Copy flutter_client_integration.dart to lib/services/

4. Copy this example file to lib/main.dart

5. Update the baseUrl in ApiService to point to your server

6. Run the app:
   flutter run

Features demonstrated:
- User authentication (login/logout)
- Course browsing and details
- Live data integration (weather, news, sports)
- Navigation between different sections
- Error handling and loading states
- Integration with both Django-style and original live data APIs
*/
