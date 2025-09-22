import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Button,
  Box,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import AdvancedVideoPlayer from './components/AdvancedVideoPlayer';
import Login from './components/Login';
import AgeVerification from './components/AgeVerification';
import './App.css';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  views: number;
  performers: Array<{
    id: string;
    name: string;
    birthDate: string;
    photoUrl: string;
  }>;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [showAdvancedPlayer, setShowAdvancedPlayer] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
    
    // Check if age verification was already done
    const ageVerifiedStorage = localStorage.getItem('age_verified');
    if (ageVerifiedStorage === 'true') {
      setAgeVerified(true);
      setShowAgeVerification(false);
    }
    
    fetchVideos();
  }, []);

  const fetchVideos = async (query?: string) => {
    try {
      setLoading(true);
      const url = query 
        ? `http://localhost:4000/api/search?q=${encodeURIComponent(query)}`
        : 'http://localhost:4000/api/videos';
      const response = await axios.get(url);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    } else {
      fetchVideos();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setShowLogin(false);
  };

  const handleAgeVerified = () => {
    setAgeVerified(true);
    setShowAgeVerification(false);
    localStorage.setItem('age_verified', 'true');
  };

  const handleAgeDeclined = () => {
    window.location.href = 'https://www.google.com';
  };

  // Show age verification first
  if (!ageVerified) {
    return (
      <div className="App">
        <AgeVerification
          open={showAgeVerification && !ageVerified}
          onVerified={handleAgeVerified}
          onDeclined={handleAgeDeclined}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <AppBar position="static" sx={{ bgcolor: '#1a1a1a' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🔞 Adult Video Aggregator
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => setShowAdvancedPlayer(true)}
            sx={{ mr: 2 }}
          >
            🔥 Advanced Player
          </Button>
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={() => setShowLogin(true)}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            sx={{ bgcolor: '#d32f2f' }}
          >
            Search
          </Button>
        </Box>

        {/* Video Grid */}
        {loading ? (
          <Typography>Loading videos...</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {videos.map((video) => (
              <Card 
                key={video.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
                onClick={() => {
                  setSelectedVideo(video);
                  setShowAdvancedPlayer(true);
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={video.thumbnail}
                  alt={video.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" component="div" noWrap>
                    {video.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {video.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(video.duration)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatViews(video.views)} views
                    </Typography>
                  </Box>
                  {video.performers.length > 0 && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      Starring: {video.performers.map(p => p.name).join(', ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {videos.length === 0 && !loading && (
          <Typography variant="h6" align="center" color="text.secondary">
            No videos found
          </Typography>
        )}
      </Container>

      {/* Advanced Video Player */}
      <AdvancedVideoPlayer
        open={showAdvancedPlayer}
        onClose={() => {
          setShowAdvancedPlayer(false);
          setSelectedVideo(null);
        }}
        initialVideo={selectedVideo}
      />

      {/* Age verification handled above */}

      {/* Login Dialog */}
      <Login
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;
