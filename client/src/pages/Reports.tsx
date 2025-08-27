import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Box,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBackRounded,
  ReportRounded,
  AddRounded,
  PersonRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface Report {
  _id: string;
  reportedUser: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      photos: string[];
    };
  };
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReportDialog, setNewReportDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New report form
  const [newReport, setNewReport] = useState({
    userId: '',
    reason: '',
    description: '',
  });

  const reportReasons = [
    'Inappropriate behavior',
    'Fake profile',
    'Harassment',
    'Spam',
    'Underage user',
    'Inappropriate photos',
    'Other'
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reports');
      setReports(response.data.reports || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!newReport.userId || !newReport.reason || !newReport.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/users/report', newReport);
      
      toast.success('Report submitted successfully! ✅');
      setNewReportDialog(false);
      setNewReport({ userId: '', reason: '', description: '' });
      fetchReports(); // Refresh the list
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'resolved': return 'success';
      case 'dismissed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Under Review';
      case 'resolved': return 'Resolved';
      case 'dismissed': return 'Dismissed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/settings')}
            sx={{ mr: 2 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setNewReportDialog(true)}
            sx={{ ml: 2 }}
          >
            New Report
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {reports.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <ReportRounded sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Reports
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You haven't submitted any reports yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setNewReportDialog(true)}
            >
              Submit Your First Report
            </Button>
          </Paper>
        ) : (
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Report History ({reports.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track the status of your reports and their resolution.
              </Typography>
            </Box>
            
            <List>
              {reports.map((report, index) => (
                <React.Fragment key={report._id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={getAvatarUrl(report.reportedUser, 56)}
                        sx={{ width: 56, height: 56 }}
                      >
                        {report.reportedUser.profile.firstName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {report.reportedUser.profile.firstName} {report.reportedUser.profile.lastName}
                          </Typography>
                          <Chip
                            label={getStatusText(report.status)}
                            color={getStatusColor(report.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Reason:</strong> {report.reason}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {report.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted on {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reports.length - 1 && <Box sx={{ borderBottom: '1px solid #e0e0e0' }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Reports are reviewed by our moderation team. We take all reports seriously 
            and will take appropriate action to maintain a safe community.
          </Typography>
        </Alert>
      </Container>

      {/* New Report Dialog */}
      <Dialog 
        open={newReportDialog} 
        onClose={() => setNewReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                value={newReport.userId}
                onChange={(e) => setNewReport(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Enter the user ID you want to report"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Reason for Report</InputLabel>
                <Select
                  value={newReport.reason}
                  onChange={(e) => setNewReport(prev => ({ ...prev, reason: e.target.value }))}
                  label="Reason for Report"
                >
                  {reportReasons.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide details about the issue..."
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewReportDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReport} 
            variant="contained"
            disabled={submitting || !newReport.userId || !newReport.reason || !newReport.description}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
