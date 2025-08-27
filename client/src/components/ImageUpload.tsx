import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getPhotoUrl } from '../utils/photoUtils';

interface ImageUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 6
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
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

  const handleReorderPhotos = async (fromIndex: number, toIndex: number) => {
    const updatedPhotos = [...photos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);

    try {
      await api.patch('/upload/photos/reorder', {
        photoOrder: updatedPhotos
      });
      
      onPhotosChange(updatedPhotos);
      toast.success('Photo order updated!');
    } catch (error: any) {
      console.error('Error reordering photos:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to reorder photos');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid photo order');
      } else {
        toast.error('Failed to reorder photos. Please try again');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) {
      handleReorderPhotos(fromIndex, toIndex);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Photos
      </Typography>
      
      {!user ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please log in to upload and manage photos
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload up to {maxPhotos} photos. Drag to reorder them.
        </Alert>
      )}

      <Grid container spacing={2}>
        {photos.map((photo, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
                         <Card
               sx={{
                 position: 'relative',
                 cursor: 'pointer',
                 '&:hover .photo-actions': {
                   opacity: 1,
                 },
               }}
               draggable={user}
               onDragStart={user ? (e) => handleDragStart(e, index) : undefined}
               onDragOver={user ? handleDragOver : undefined}
               onDrop={user ? (e) => handleDrop(e, index) : undefined}
             >
              <CardMedia
                component="img"
                height="200"
                image={getPhotoUrl(photo)}
                alt={`Photo ${index + 1}`}
                onClick={() => {
                  setSelectedPhoto(photo);
                  setPreviewDialogOpen(true);
                }}
              />
              
              <Box
                className="photo-actions"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  gap: 1,
                }}
              >
                                 {user && (
                   <IconButton
                     size="small"
                     sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeletePhoto(index);
                     }}
                   >
                     <DeleteIcon fontSize="small" />
                   </IconButton>
                 )}
              </Box>

              {index === 0 && (
                <Chip
                  label="Primary"
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                  }}
                />
              )}

                             {user && (
                 <Box
                   sx={{
                     position: 'absolute',
                     top: 8,
                     left: 8,
                     bgcolor: 'rgba(0,0,0,0.5)',
                     borderRadius: 1,
                     p: 0.5,
                   }}
                 >
                   <DragIcon sx={{ color: 'white', fontSize: 16 }} />
                 </Box>
               )}
            </Card>
          </Grid>
        ))}

                 {photos.length < maxPhotos && user && (
           <Grid item xs={6} sm={4} md={3}>
             <Card
               sx={{
                 height: 200,
                 display: 'flex',
                 flexDirection: 'column',
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
              {uploading ? (
                <CircularProgress size={40} />
              ) : (
                <>
                  <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Add Photo
                  </Typography>
                </>
              )}
            </Card>
          </Grid>
        )}
      </Grid>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Photo Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Photo Preview</DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <img
                              src={getPhotoUrl(selectedPhoto)}
              alt="Preview"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUpload;
