import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

interface AgeVerificationProps {
  open: boolean;
  onVerified: () => void;
  onDeclined: () => void;
}

const AgeVerification: React.FC<AgeVerificationProps> = ({ open, onVerified, onDeclined }) => {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ textAlign: 'center', color: 'error.main' }}>
        Age Verification Required
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="warning">
            This site contains adult content intended for viewers 18 years of age and older.
          </Alert>
          
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            <strong>You must be 18 or older to view this content.</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            By clicking "I am 18+", you certify that you are 18 years of age or older and 
            agree to view adult content. If you are under 18, please click "Exit".
          </Typography>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" color="primary">
              🔞 Adult Content Warning 🔞
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={onDeclined}
          size="large"
        >
          Exit - I am under 18
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onVerified}
          size="large"
        >
          I am 18+ - Enter Site
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgeVerification;