import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../network/services/ai_service.dart';

class AIDashboardPage extends StatefulWidget {
  const AIDashboardPage({Key? key}) : super(key: key);

  @override
  _AIDashboardPageState createState() => _AIDashboardPageState();
}

class _AIDashboardPageState extends State<AIDashboardPage> {
  Map<String, dynamic> dashboardData = {};
  Map<String, dynamic> statistics = {};
  bool isLoading = true;
  String searchQuery = '';
  int selectedTab = 0;

  @override
  void initState() {
    super.initState();
    loadAIData();
  }

  Future<void> loadAIData() async {
    setState(() => isLoading = true);

    try {
      final dashboard = await AIService.fetchAIDashboard();
      final stats = await AIService.getAIStatistics();

      setState(() {
        dashboardData = dashboard;
        statistics = stats;
        isLoading = false;
      });
    } catch (e) {
      print('Error loading AI data: $e');
      setState(() => isLoading = false);
    }
  }

  Future<void> refreshData() async {
    await loadAIData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Hub Dashboard'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: refreshData),
        ],
      ),
      body: isLoading ? _buildLoadingWidget() : _buildDashboard(),
    );
  }

  Widget _buildLoadingWidget() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading AI data...'),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return RefreshIndicator(
      onRefresh: refreshData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatisticsCards(),
            const SizedBox(height: 20),
            _buildSearchBar(),
            const SizedBox(height: 20),
            _buildTabBar(),
            const SizedBox(height: 16),
            _buildTabContent(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsCards() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.5,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _buildStatCard(
          'Models',
          statistics['total_models']?.toString() ?? '0',
          Colors.blue,
          Icons.model_training,
        ),
        _buildStatCard(
          'Datasets',
          statistics['total_datasets']?.toString() ?? '0',
          Colors.green,
          Icons.dataset,
        ),
        _buildStatCard(
          'Papers',
          statistics['total_papers']?.toString() ?? '0',
          Colors.orange,
          Icons.article,
        ),
        _buildStatCard(
          'News',
          statistics['total_news']?.toString() ?? '0',
          Colors.red,
          Icons.newspaper,
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color color,
    IconData icon,
  ) {
    return Card(
      elevation: 4,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color.withOpacity(0.8), color.withOpacity(0.6)],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Colors.white),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              title,
              style: const TextStyle(fontSize: 14, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      decoration: InputDecoration(
        hintText: 'Search AI models, papers, news...',
        prefixIcon: const Icon(Icons.search),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Colors.grey[100],
      ),
      onChanged: (value) {
        setState(() {
          searchQuery = value;
        });
      },
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildTabButton('Overview', 0),
          _buildTabButton('Models', 1),
          _buildTabButton('Papers', 2),
          _buildTabButton('News', 3),
        ],
      ),
    );
  }

  Widget _buildTabButton(String text, int index) {
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selectedTab == index
                ? Colors.deepPurple
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selectedTab == index ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (selectedTab) {
      case 0:
        return _buildOverviewContent();
      case 1:
        return _buildModelsContent();
      case 2:
        return _buildPapersContent();
      case 3:
        return _buildNewsContent();
      default:
        return _buildOverviewContent();
    }
  }

  Widget _buildOverviewContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Trending Topics',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.deepPurple,
          ),
        ),
        const SizedBox(height: 12),
        _buildTrendingTopics(),
        const SizedBox(height: 20),
        Text(
          'Quick Stats',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.deepPurple,
          ),
        ),
        const SizedBox(height: 12),
        _buildQuickStats(),
      ],
    );
  }

  Widget _buildTrendingTopics() {
    final topics = dashboardData['trending_topics'] ?? [];
    if (topics.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No trending topics available'),
        ),
      );
    }

    return Column(
      children: topics.take(5).map<Widget>((topic) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.trending_up, color: Colors.green),
            title: Text(topic.toString()),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuickStats() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      childAspectRatio: 1.2,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      children: [
        _buildQuickStat(
          'Community',
          statistics['total_community']?.toString() ?? '0',
          Colors.blue,
        ),
        _buildQuickStat(
          'Repos',
          statistics['total_repos']?.toString() ?? '0',
          Colors.purple,
        ),
        _buildQuickStat(
          'Updated',
          _formatTimeAgo(statistics['last_updated']),
          Colors.grey,
        ),
      ],
    );
  }

  Widget _buildQuickStat(String title, String value, Color color) {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: color.withOpacity(0.1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: const TextStyle(fontSize: 10, color: Colors.black87),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModelsContent() {
    return FutureBuilder<List<dynamic>>(
      future: AIService.fetchAIModels(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No AI models available'),
            ),
          );
        }

        final models = snapshot.data!;
        return Column(
          children: models.take(8).map<Widget>((model) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.model_training, color: Colors.blue),
                title: Text(model['name'] ?? 'Unknown Model'),
                subtitle: Text(
                  model['description'] ?? 'No description available',
                ),
                trailing: Chip(
                  label: Text(model['downloads']?.toString() ?? '0'),
                  backgroundColor: Colors.blue.withOpacity(0.2),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildPapersContent() {
    return FutureBuilder<List<dynamic>>(
      future: AIService.fetchAIPapers(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No AI papers available'),
            ),
          );
        }

        final papers = snapshot.data!;
        return Column(
          children: papers.take(6).map<Widget>((paper) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.article, color: Colors.orange),
                title: Text(
                  paper['title'] ?? 'Unknown Paper',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  paper['authors']?.join(', ') ?? 'Unknown Authors',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  paper['published']?.toString().split('T')[0] ?? '',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildNewsContent() {
    return FutureBuilder<List<dynamic>>(
      future: AIService.fetchAINews(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No AI news available'),
            ),
          );
        }

        final news = snapshot.data!;
        return Column(
          children: news.take(6).map<Widget>((article) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.newspaper, color: Colors.red),
                title: Text(
                  article['title'] ?? 'Unknown Article',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  article['source'] ?? 'Unknown Source',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  article['publishedAt']?.toString().split('T')[0] ?? '',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  String _formatTimeAgo(String? timestamp) {
    if (timestamp == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'N/A';
    }
  }
}
