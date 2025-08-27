import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUtils';

interface QuickPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const QuickPhotoUpload: React.FC<QuickPhotoUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 6
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if user is authenticated
    if (!user) {
      toast.error('Please log in to upload photos');
      return;
    }

    if (photos.length + files.length > maxPhotos) {
      toast.error(`You can only upload up to ${maxPhotos} photos`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('photos', file);
      });

      const response = await api.post('/upload/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPhotosChange(response.data.photos);
      toast.success('Photos uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to upload photos');
      } else if (error.response?.status === 413) {
        toast.error('File too large. Please select smaller images');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid file format');
      } else {
        toast.error('Failed to upload photos. Please try again');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    try {
      await api.delete(`/upload/photos/${photoIndex}`);
      
      const updatedPhotos = photos.filter((_, index) => index !== photoIndex);
      onPhotosChange(updatedPhotos);
      
      toast.success('Photo deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to delete photos');
      } else if (error.response?.status === 404) {
        toast.error('Photo not found');
      } else {
        toast.error('Failed to delete photo. Please try again');
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      {!user ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please log in to upload photos
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
            onClick={openFileDialog}
            disabled={uploading || photos.length >= maxPhotos}
            sx={{ minWidth: 120 }}
          >
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            {photos.length}/{maxPhotos} photos
          </Typography>
        </Box>
      )}

      {/* Current Photos */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {photos.map((photo, index) => (
          <Card
            key={index}
            sx={{
              width: 80,
              height: 80,
              position: 'relative',
              '&:hover .delete-btn': {
                opacity: 1,
              },
            }}
          >
            <CardMedia
              component="img"
              height="80"
              image={getPhotoUrl(photo)}
              alt={`Photo ${index + 1}`}
            />
            <IconButton
              className="delete-btn"
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
              }}
              onClick={() => handleDeletePhoto(index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Card>
        ))}

        {photos.length < maxPhotos && (
          <Card
            sx={{
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #ccc',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={openFileDialog}
          >
            <AddIcon sx={{ color: 'text.secondary' }} />
          </Card>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {photos.length < 3 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Add at least 3 photos to increase your chances of getting matches!
        </Alert>
      )}
    </Box>
  );
};

export default QuickPhotoUpload;
