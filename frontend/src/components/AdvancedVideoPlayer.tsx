import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  Queue as QueueIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

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

interface AdvancedVideoPlayerProps {
  open: boolean;
  onClose: () => void;
  initialVideo?: Video | null;
}

const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  open,
  onClose,
  initialVideo,
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideo1, setCurrentVideo1] = useState<Video | null>(initialVideo || null);
  const [currentVideo2, setCurrentVideo2] = useState<Video | null>(null);
  const [isPlayer1Playing, setIsPlayer1Playing] = useState(false);
  const [isPlayer2Playing, setIsPlayer2Playing] = useState(false);
  const [hideThumbnails, setHideThumbnails] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const player1Ref = useRef<HTMLVideoElement>(null);
  const player2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      fetchVideos();
      if (initialVideo) {
        setCurrentVideo1(initialVideo);
      }
    }
  }, [open, initialVideo]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/videos');
      setVideos(response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(videos);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:4000/api/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching videos:', error);
    }
  };

  const addToQueue = (video: Video) => {
    if (!queue.find(v => v.id === video.id)) {
      setQueue([...queue, video]);
    }
  };

  const removeFromQueue = (videoId: string) => {
    setQueue(queue.filter(v => v.id !== videoId));
  };

  const playNext = () => {
    if (queue.length > 0) {
      const nextVideo = queue[0];
      setCurrentVideo1(nextVideo);
      setQueue(queue.slice(1));
      if (player1Ref.current) {
        player1Ref.current.load();
        player1Ref.current.play();
        setIsPlayer1Playing(true);
      }
    }
  };

  const playInPlayer = (video: Video, playerNumber: 1 | 2) => {
    if (playerNumber === 1) {
      setCurrentVideo1(video);
      setTimeout(() => {
        if (player1Ref.current) {
          player1Ref.current.load();
          player1Ref.current.play();
          setIsPlayer1Playing(true);
        }
      }, 100);
    } else {
      setCurrentVideo2(video);
      setTimeout(() => {
        if (player2Ref.current) {
          player2Ref.current.load();
          player2Ref.current.play();
          setIsPlayer2Playing(true);
        }
      }, 100);
    }
  };

  const togglePlay = (playerNumber: 1 | 2) => {
    const player = playerNumber === 1 ? player1Ref.current : player2Ref.current;
    const isPlaying = playerNumber === 1 ? isPlayer1Playing : isPlayer2Playing;
    const setIsPlaying = playerNumber === 1 ? setIsPlayer1Playing : setIsPlayer2Playing;

    if (player) {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          🔥 Advanced Video Player
        </Typography>
        <IconButton onClick={onClose} color="error">
          <CloseIcon />
        </IconButton>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Video Players */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Dual Video Players */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            {/* Player 1 */}
            <Card>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                  Player 1 {currentVideo1 && `- ${currentVideo1.title}`}
                </Typography>
                <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'black' }}>
                  {currentVideo1 ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      {currentVideo1.url.includes('embed') || currentVideo1.url.includes('pornhub.com') || currentVideo1.url.includes('xvideos.com') || currentVideo1.url.includes('redtube.com') || currentVideo1.url.includes('tube8.com') || currentVideo1.url.includes('youporn.com') || currentVideo1.url.includes('spankbang.com') || currentVideo1.url.includes('eporner.com') || currentVideo1.url.includes('beeg.com') ? (
                        <iframe
                          src={currentVideo1.url}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allowFullScreen
                          style={{ border: 'none' }}
                          title={`Adult Video: ${currentVideo1.title}`}
                        />
                      ) : (
                        <>
                          <video
                            ref={player1Ref}
                            width="100%"
                            height="100%"
                            controls
                            poster={hideThumbnails ? undefined : currentVideo1.thumbnail}
                            style={{ objectFit: 'contain' }}
                            onPlay={() => setIsPlayer1Playing(true)}
                            onPause={() => setIsPlayer1Playing(false)}
                          >
                            <source src={currentVideo1.url} type="video/mp4" />
                          </video>
                          {/* Adult Content Information Overlay */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 10,
                              left: 10,
                              right: 10,
                              bgcolor: 'rgba(0, 0, 0, 0.8)',
                              color: 'white',
                              p: 1.5,
                              borderRadius: 1,
                              zIndex: 10
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ff1493' }}>
                              🔞 NOW PLAYING: {currentVideo1.title}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                              Premium Adult Content • {formatDuration(currentVideo1.duration)} • {formatViews(currentVideo1.views)} views
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mt: 0.5 }}>
                              Performers: {currentVideo1.performers.map(p => p.name).join(', ')}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}>
                      Select a video to play
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <IconButton onClick={() => togglePlay(1)} color="primary" disabled={!currentVideo1}>
                    {isPlayer1Playing ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <IconButton onClick={playNext} color="primary" disabled={queue.length === 0}>
                    <SkipNextIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>

            {/* Player 2 */}
            <Card>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'secondary.main' }}>
                  Player 2 {currentVideo2 && `- ${currentVideo2.title}`}
                </Typography>
                <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'black' }}>
                  {currentVideo2 ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      {currentVideo2.url.includes('embed') || currentVideo2.url.includes('pornhub.com') || currentVideo2.url.includes('xvideos.com') || currentVideo2.url.includes('redtube.com') || currentVideo2.url.includes('tube8.com') || currentVideo2.url.includes('youporn.com') || currentVideo2.url.includes('spankbang.com') || currentVideo2.url.includes('eporner.com') || currentVideo2.url.includes('beeg.com') ? (
                        <iframe
                          src={currentVideo2.url}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allowFullScreen
                          style={{ border: 'none' }}
                          title={`Adult Video: ${currentVideo2.title}`}
                        />
                      ) : (
                        <>
                          <video
                            ref={player2Ref}
                            width="100%"
                            height="100%"
                            controls
                            poster={hideThumbnails ? undefined : currentVideo2.thumbnail}
                            style={{ objectFit: 'contain' }}
                            onPlay={() => setIsPlayer2Playing(true)}
                            onPause={() => setIsPlayer2Playing(false)}
                          >
                            <source src={currentVideo2.url} type="video/mp4" />
                          </video>
                          {/* Adult Content Information Overlay */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 10,
                              left: 10,
                              right: 10,
                              bgcolor: 'rgba(0, 0, 0, 0.8)',
                              color: 'white',
                              p: 1.5,
                              borderRadius: 1,
                              zIndex: 10
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                              🔞 NOW PLAYING: {currentVideo2.title}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                              Premium Adult Content • {formatDuration(currentVideo2.duration)} • {formatViews(currentVideo2.views)} views
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mt: 0.5 }}>
                              Performers: {currentVideo2.performers.map(p => p.name).join(', ')}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}>
                      Select a video to play
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <IconButton onClick={() => togglePlay(2)} color="secondary" disabled={!currentVideo2}>
                    {isPlayer2Playing ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Queue */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <QueueIcon sx={{ mr: 1 }} />
                Play Queue ({queue.length})
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {queue.map((video, index) => (
                  <ListItem
                    key={video.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => removeFromQueue(video.id)}>
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={hideThumbnails ? undefined : video.thumbnail}
                        sx={{ bgcolor: 'primary.main' }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={video.title}
                      secondary={`${formatDuration(video.duration)} • ${formatViews(video.views)} views`}
                    />
                  </ListItem>
                ))}
                {queue.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No videos in queue. Add videos from the search results.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar - Search & Video List */}
        <Paper elevation={1} sx={{ width: 350, display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search adult videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ mb: 1 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Box>

          {/* Controls */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={hideThumbnails}
                  onChange={(e) => setHideThumbnails(e.target.checked)}
                />
              }
              label="Hide Thumbnails"
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Video Results */}
          <Typography variant="h6" sx={{ mb: 1 }}>
            Videos ({searchResults.length})
          </Typography>
          
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {searchResults.map((video) => (
              <ListItem key={video.id} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 1 }}>
                <Card sx={{ width: '100%' }}>
                  <CardContent sx={{ p: 1 }}>
                    {!hideThumbnails && (
                      <Box
                        component="img"
                        src={video.thumbnail}
                        alt={video.title}
                        sx={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 1
                        }}
                      />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {formatDuration(video.duration)} • {formatViews(video.views)} views
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => playInPlayer(video, 1)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        P1
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        onClick={() => playInPlayer(video, 2)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        P2
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => addToQueue(video)}
                        color="info"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdvancedVideoPlayer;