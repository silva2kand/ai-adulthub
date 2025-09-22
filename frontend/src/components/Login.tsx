import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';

interface LoginProps {
  open: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ open, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Simple demo authentication
    if (username === 'admin' && password === 'admin') {
      const fakeToken = 'fake-jwt-token-' + Date.now();
      localStorage.setItem('auth_token', fakeToken);
      onLogin(fakeToken);
      onClose();
      setError('');
    } else {
      setError('Invalid username or password. Use admin/admin for demo.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Typography variant="body2" color="text.secondary">
            Demo credentials: admin / admin
          </Typography>

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleLogin}>
              Login
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Login;