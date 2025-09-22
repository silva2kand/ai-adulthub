import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
// Using HTML5 video element instead of ReactPlayer for simplicity

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

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.7)',
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Video Player */}
      <Box sx={{ width: '100%', aspectRatio: '16/9', mb: 2, bgcolor: 'black' }}>
        <video
          width="100%"
          height="100%"
          controls
          poster={video.thumbnail}
          style={{ objectFit: 'contain' }}
        >
          <source src={video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>

      {/* Video Info */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          {video.title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Chip 
            label={`${formatViews(video.views)} views`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={formatDuration(video.duration)} 
            size="small" 
            variant="outlined" 
          />
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {video.description}
        </Typography>

        {/* Performers */}
        {video.performers.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Performers
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {video.performers.map((performer) => (
                <Box
                  key={performer.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Avatar
                    src={performer.photoUrl}
                    alt={performer.name}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box>
                    <Typography variant="subtitle2">
                      {performer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Born: {new Date(performer.birthDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;