import 'package:flutter/material.dart';
import 'features/ai/ai_dashboard_page.dart';
import 'network/services/ai_service.dart';
import 'network/urls.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Hub Demo',
      theme: ThemeData(primarySwatch: Colors.deepPurple, useMaterial3: true),
      home: const AIHubDemo(),
    );
  }
}

class AIHubDemo extends StatefulWidget {
  const AIHubDemo({Key? key}) : super(key: key);

  @override
  _AIHubDemoState createState() => _AIHubDemoState();
}

class _AIHubDemoState extends State<AIHubDemo> {
  int _selectedIndex = 0;
  bool _isLoading = false;
  String _lastUpdate = '';

  final List<Widget> _pages = [
    const AIDashboardPage(),
    const AIModelsPage(),
    const AIPapersPage(),
    const AINewsPage(),
  ];

  @override
  void initState() {
    super.initState();
    _updateLastUpdateTime();
  }

  void _updateLastUpdateTime() {
    setState(() {
      _lastUpdate = DateTime.now().toString().split('.')[0];
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Future<void> _refreshAllData() async {
    setState(() => _isLoading = true);

    try {
      // Refresh all AI data
      await AIService.fetchAllAIData();
      _updateLastUpdateTime();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AI data refreshed successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error refreshing data: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Hub Demo'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _refreshAllData,
              tooltip: 'Refresh All Data',
            ),
        ],
      ),
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.model_training),
            label: 'Models',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.article), label: 'Papers'),
          BottomNavigationBarItem(icon: Icon(Icons.newspaper), label: 'News'),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.deepPurple,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
      ),
      drawer: _buildDrawer(),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.deepPurple, Colors.deepPurple.shade700],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Icon(Icons.psychology, size: 48, color: Colors.white),
                const SizedBox(height: 8),
                const Text(
                  'AI Hub',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Last Update: $_lastUpdate',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home'),
            onTap: () {
              Navigator.pop(context);
              setState(() => _selectedIndex = 0);
            },
          ),
          ListTile(
            leading: const Icon(Icons.dataset),
            title: const Text('Datasets'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AIDatasetsPage()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.code),
            title: const Text('Repositories'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AIReposPage()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.forum),
            title: const Text('Community'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AICommunityPage(),
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info),
            title: const Text('About'),
            onTap: () {
              Navigator.pop(context);
              _showAboutDialog();
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
              _showSettingsDialog();
            },
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('About AI Hub'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('AI Hub Demo Application'),
              const SizedBox(height: 8),
              Text('Base URL: ${URLS.BASE_URL}'),
              const SizedBox(height: 8),
              const Text('Features:'),
              const Text('• Trending AI Models'),
              const Text('• AI Research Papers'),
              const Text('• AI News & Updates'),
              const Text('• Community Discussions'),
              const Text('• GitHub Repositories'),
              const Text('• Hugging Face Datasets'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Settings'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Auto Refresh'),
                subtitle: const Text(
                  'Automatically refresh data every 5 minutes',
                ),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // Handle auto refresh setting
                  },
                ),
              ),
              ListTile(
                title: const Text('Data Limit'),
                subtitle: const Text('Maximum items to display: 8'),
                onTap: () {
                  // Handle data limit setting
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}

// Additional pages for navigation
class AIModelsPage extends StatelessWidget {
  const AIModelsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Models'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAIModels(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No AI models available'));
          }

          final models = snapshot.data!;
          return ListView.builder(
            itemCount: models.length,
            itemBuilder: (context, index) {
              final model = models[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.model_training, color: Colors.blue),
                  title: Text(model['name'] ?? 'Unknown Model'),
                  subtitle: Text(model['description'] ?? 'No description'),
                  trailing: Chip(
                    label: Text('${model['downloads'] ?? 0}'),
                    backgroundColor: Colors.blue.withOpacity(0.2),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class AIPapersPage extends StatelessWidget {
  const AIPapersPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Research Papers'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAIPapers(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No AI papers available'));
          }

          final papers = snapshot.data!;
          return ListView.builder(
            itemCount: papers.length,
            itemBuilder: (context, index) {
              final paper = papers[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.article, color: Colors.orange),
                  title: Text(paper['title'] ?? 'Unknown Paper'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(paper['authors']?.join(', ') ?? 'Unknown Authors'),
                      Text(paper['published']?.toString().split('T')[0] ?? ''),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class AINewsPage extends StatelessWidget {
  const AINewsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI News'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAINews(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No AI news available'));
          }

          final news = snapshot.data!;
          return ListView.builder(
            itemCount: news.length,
            itemBuilder: (context, index) {
              final article = news[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.newspaper, color: Colors.red),
                  title: Text(article['title'] ?? 'Unknown Article'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(article['source'] ?? 'Unknown Source'),
                      Text(
                        article['publishedAt']?.toString().split('T')[0] ?? '',
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class AIDatasetsPage extends StatelessWidget {
  const AIDatasetsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Datasets'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAIDatasets(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No AI datasets available'));
          }

          final datasets = snapshot.data!;
          return ListView.builder(
            itemCount: datasets.length,
            itemBuilder: (context, index) {
              final dataset = datasets[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.dataset, color: Colors.green),
                  title: Text(dataset['name'] ?? 'Unknown Dataset'),
                  subtitle: Text(dataset['description'] ?? 'No description'),
                  trailing: Chip(
                    label: Text('${dataset['downloads'] ?? 0}'),
                    backgroundColor: Colors.green.withOpacity(0.2),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class AIReposPage extends StatelessWidget {
  const AIReposPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Repositories'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAIRepos(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No AI repositories available'));
          }

          final repos = snapshot.data!;
          return ListView.builder(
            itemCount: repos.length,
            itemBuilder: (context, index) {
              final repo = repos[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.code, color: Colors.purple),
                  title: Text(repo['name'] ?? 'Unknown Repository'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(repo['description'] ?? 'No description'),
                      Text(repo['language'] ?? 'Unknown Language'),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                      Text('${repo['stars'] ?? 0}'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class AICommunityPage extends StatelessWidget {
  const AICommunityPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Community'),
        backgroundColor: Colors.deepPurple,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: AIService.fetchAICommunity(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No community posts available'));
          }

          final posts = snapshot.data!;
          return ListView.builder(
            itemCount: posts.length,
            itemBuilder: (context, index) {
              final post = posts[index];
              return Card(
                margin: const EdgeInsets.all(8),
                child: ListTile(
                  leading: const Icon(Icons.forum, color: Colors.blue),
                  title: Text(post['title'] ?? 'Unknown Post'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(post['author'] ?? 'Unknown Author'),
                      Text(post['created_at']?.toString().split('T')[0] ?? ''),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.comment, color: Colors.grey, size: 16),
                      Text('${post['comments'] ?? 0}'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
