import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import SendIcon from '@mui/icons-material/Send';
import EventIcon from '@mui/icons-material/Event';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';

const ExecutiveDirectorDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: 'Executive Director',
    position: 'Executive Director',
    email: 'executive.director@university.edu',
    department: 'Engineering'
  });
  const [meetings, setMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock student question performance data
  const [studentQuestionPerformance, setStudentQuestionPerformance] = useState([
    { id: 1, question: 'Question 1', score: 92, color: '#1a73e8' },
    { id: 2, question: 'Question 2', score: 72, color: '#00c853' },
    { id: 3, question: 'Question 3', score: 54, color: '#ffca28' },
    { id: 4, question: 'Question 4', score: 63, color: '#f44336' },
  ]);

  // Mock staff question performance data
  const [staffQuestionPerformance, setStaffQuestionPerformance] = useState([
    { id: 1, question: 'Question 1', score: 85, color: '#1a73e8' },
    { id: 2, question: 'Question 2', score: 65, color: '#00c853' },
    { id: 3, question: 'Question 3', score: 70, color: '#ffca28' },
    { id: 4, question: 'Question 4', score: 50, color: '#f44336' },
  ]);

  // Add performance summary stats
  const [performanceSummary, setPerformanceSummary] = useState({
    studentOverall: 78,
    staffOverall: 65
  });

  // Define sidebar tabs
  const tabs = [
    { id: 'profile', label: "Profile", icon: <PersonIcon /> },
    { id: 'meetings', label: "Meetings", icon: <EventIcon /> },
    { id: 'analytics', label: "Analytics", icon: <BarChartIcon /> },
    { id: 'reports', label: "Reports", icon: <AssessmentIcon /> }
  ];

  // Check authentication and role on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    // Check for authentication
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Normalize and check role - be flexible with role format
    const normalizedRole = userRole ? userRole.toLowerCase() : '';
    const isExecutiveDirector = 
      normalizedRole === 'executive_director' || 
      normalizedRole === 'executive-director' || 
      normalizedRole === 'executivedirector' ||
      normalizedRole.includes('executive');
    
    if (!isExecutiveDirector) {
      console.log(`Invalid role for executive director dashboard: ${userRole}`);
      setSnackbar({
        open: true,
        message: 'You do not have permission to access this dashboard',
        severity: 'error'
      });
      navigate('/login');
      return;
    }
    
    console.log('Authentication successful for Executive Director dashboard');
    
    // Load meetings immediately on component mount
    fetchMeetings();
    
  }, [navigate]);

  // Separate fetchMeetings function
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching meetings for Executive Director dashboard');
      
      try {
        // Use the standard /meetings endpoint to get all meetings
        const response = await axios.get('http://localhost:8080/api/meetings', {
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} meetings from API`);
          
          // Executive Director should see ALL meetings regardless of role/department/year
          const sortedMeetings = response.data.sort((a, b) => {
            const dateA = new Date(a.meetingDate || a.date || '');
            const dateB = new Date(b.meetingDate || b.date || '');
            return dateA - dateB;
          });
          
          // Store meetings in localStorage for offline access
          localStorage.setItem('allMeetings', JSON.stringify(sortedMeetings));
          setMeetings(sortedMeetings);
          console.log('Meetings set in state:', sortedMeetings.length);
        } else {
          console.error('Invalid meeting data format:', response.data);
        }
      } catch (apiError) {
        console.error('API fetch failed, trying localStorage:', apiError);
        
        // If API fails with 401, clear token and redirect to login
        if (apiError.response?.status === 401) {
          localStorage.removeItem('token');
          setSnackbar({
            open: true,
            message: 'Session expired. Please log in again.',
            severity: 'error'
          });
          navigate('/login');
          return;
        }
        
        // If API fails for other reasons, try to load from localStorage
        const storedMeetings = localStorage.getItem('allMeetings');
        if (storedMeetings) {
          try {
            const parsedMeetings = JSON.parse(storedMeetings);
            if (Array.isArray(parsedMeetings)) {
              console.log('Loaded meetings from localStorage:', parsedMeetings.length);
              setMeetings(parsedMeetings);
            }
          } catch (parseError) {
            console.error('Error parsing stored meetings:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchMeetings:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load meetings. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/users/profile', {
          headers: {
            'x-access-token': token
          }
        });
        
        console.log('User profile loaded successfully:', response.data);
        // Update the userProfile state with data from API, but keep consistent name and department
        if (response.data) {
          setUserProfile({
            name: 'Executive Director', // Always use "Executive Director" as the name
            position: 'Executive Director',
            email: response.data.email || 'executive.director@university.edu',
            department: 'Engineering' // Always use "Engineering" as the department
          });
          
          // Store in localStorage for future use
          localStorage.setItem('userData', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Use default profile data if API fails
        setUserProfile({
          name: 'Executive Director',
          position: 'Executive Director',
          email: 'executive.director@university.edu',
          department: 'Engineering'
        });
      }
    };

    fetchUserProfile();
  }, []);

  // Improved department fetch with better error handling
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token available for fetching departments');
          return;
        }
        
        const response = await axios.get('http://localhost:8080/api/departments', {
          headers: {
            'x-access-token': token
          }
        });
        
        if (response.data) {
          setDepartments(response.data);
          console.log('Departments loaded successfully:', response.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Load default departments if API fails
        setDepartments([
          { id: '1', name: 'Computer Science' },
          { id: '2', name: 'Information Technology' },
          { id: '3', name: 'Electronics and Communication' },
          { id: '4', name: 'Electrical Engineering' },
          { id: '5', name: 'Mechanical Engineering' }
        ]);
      }
    };

    fetchDepartments();
  }, []);

  const handleDownloadReport = async (role, type) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to download reports',
          severity: 'error'
        });
        return;
      }

      // Construct the appropriate endpoint based on role and type
      const endpoint = `/reports/${role}/${type}`;

      const response = await axios.get(endpoint, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${role}-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download report. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Render student performance chart
  const renderStudentPerformanceChart = () => (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Student Performance %</Typography>
      
      <Box sx={{ height: '400px', bgcolor: '#f5f5f7', p: 3, borderRadius: 1 }}>
        <Grid container spacing={2}>
          {/* Y-axis labels */}
          <Grid item xs={1}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Typography>100</Typography>
              <Typography>80</Typography>
              <Typography>60</Typography>
              <Typography>40</Typography>
              <Typography>20</Typography>
              <Typography>0</Typography>
            </Box>
          </Grid>
          
          {/* Chart bars */}
          <Grid item xs={11}>
            <Box sx={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
              {studentQuestionPerformance.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                  <Box 
                    sx={{ 
                      width: '80%', 
                      height: `${item.score * 3}px`, 
                      bgcolor: item.color,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }} 
                  />
                  <Typography sx={{ mt: 1 }}>{item.question}</Typography>
                </Box>
              ))}
            </Box>
            
            {/* X-axis line */}
            <Box sx={{ 
              height: '1px', 
              bgcolor: '#ddd', 
              width: '100%', 
              mt: 1 
            }} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  // Render staff performance chart
  const renderStaffPerformanceChart = () => (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Staff Performance %</Typography>
      
      <Box sx={{ height: '400px', bgcolor: '#f5f5f7', p: 3, borderRadius: 1 }}>
        <Grid container spacing={2}>
          {/* Y-axis labels */}
          <Grid item xs={1}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Typography>100</Typography>
              <Typography>80</Typography>
              <Typography>60</Typography>
              <Typography>40</Typography>
              <Typography>20</Typography>
              <Typography>0</Typography>
            </Box>
          </Grid>
          
          {/* Chart bars */}
          <Grid item xs={11}>
            <Box sx={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
              {staffQuestionPerformance.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                  <Box 
                    sx={{ 
                      width: '80%', 
                      height: `${item.score * 3}px`, 
                      bgcolor: item.color,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }} 
                  />
                  <Typography sx={{ mt: 1 }}>{item.question}</Typography>
                </Box>
              ))}
            </Box>
            
            {/* X-axis line */}
            <Box sx={{ 
              height: '1px', 
              bgcolor: '#ddd', 
              width: '100%', 
              mt: 1 
            }} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  // Render profile section
  const renderProfile = () => (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 0,
      position: 'relative'
    }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Executive Director Profile</Typography>
      
      <Box sx={{ 
        display: 'flex',
        alignItems: 'flex-start',
        mb: 0
      }}>
        <Avatar sx={{ width: 76, height: 76, bgcolor: '#1A2137', mr: 4 }}>
          {userProfile.name ? userProfile.name.charAt(0) : 'S'}
        </Avatar>
        
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Name</Typography>
              <Typography variant="body1">{userProfile.name}</Typography>
            </Box>
            
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Position</Typography>
              <Typography variant="body1">{userProfile.position}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Email</Typography>
              <Typography variant="body1">{userProfile.email}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>Department</Typography>
              <Typography variant="body1">{userProfile.department}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  // Render dashboard overview
  const renderDashboard = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Dashboard Overview</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Meetings</Typography>
              <Typography variant="h4" sx={{ color: '#1A2137' }}>{meetings.length}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across all departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Departments</Typography>
              <Typography variant="h4" sx={{ color: '#1A2137' }}>{departments.length}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active in the system
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
                <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadReport('student', 'overall')}
              sx={{ 
                bgcolor: '#1A2137', 
                '&:hover': { bgcolor: '#2A3147' },
                fontWeight: 'medium',
                px: 3,
                py: 1
              }}
            >
              Download Complete Report
                  </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // Helper function to get department name from id
  const getDepartmentName = (departmentId) => {
    // If departmentId is an object, try to extract the name or id
    if (departmentId && typeof departmentId === 'object') {
      return departmentId.name || departmentId.id || 'Unknown Department';
    }
    
    // Handle string department IDs
    switch(String(departmentId)) {
      case '1':
        return 'Computer Science';
      case '2':
        return 'Information Technology';
      case '3':
        return 'Electronics and Communication';
      case '4':
        return 'Electrical Engineering';
      case '5':
        return 'Mechanical Engineering';
      default:
        return departmentId || 'Unknown Department';
    }
  };
  
  // Render meeting list with formatted data
  const renderMeetingCard = (meeting) => {
    const dateValue = meeting.date || meeting.meetingDate;
    const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString() : '';
    // Map roleId to readable role name
    const roleDisplay = meeting.roleId 
      ? (meeting.roleId === 1 ? 'Student' : meeting.roleId === 2 ? 'Staff' : 'Not specified')
      : (meeting.role || 'Not specified');
    const timeDisplay = meeting.startTime && meeting.endTime
      ? `${meeting.startTime} - ${meeting.endTime}`
      : '';
    const departmentName = getDepartmentName(meeting.department || meeting.departmentId);
    const yearDisplay = (roleDisplay.toLowerCase().trim() === 'student' || meeting.roleId === 1) ? (meeting.year || '-') : '-';

    return (
      <Card key={meeting.id} sx={{ mb: 2, borderRadius: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {meeting.title}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Date:</strong> {formattedDate}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Time:</strong> {timeDisplay}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Role:</strong> {roleDisplay}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Department:</strong> {departmentName}
              </Typography>
              {roleDisplay.toLowerCase().trim() === 'student' && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Year:</strong> {yearDisplay}
                </Typography>
              )}
            </Grid>
                </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render meetings section
  const renderMeetings = () => {
    // Filter out past meetings
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for date comparison

    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date || meeting.meetingDate);
      meetingDate.setHours(0, 0, 0, 0);
      return meetingDate >= now;
    });

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Upcoming Meetings
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && upcomingMeetings.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f7' }}>
            <Typography>No upcoming meetings scheduled.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
                <Grid item xs={12}>
              {upcomingMeetings.map(meeting => renderMeetingCard(meeting))}
            </Grid>
                </Grid>
        )}
      </Box>
    );
  };

  // Render reports section
  const renderReports = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          Reports
        </Typography>
        
        <Grid container spacing={4}>
          {/* Overall Score Reports */}
                <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
                Overall Score Reports
              </Typography>
              <Grid container spacing={3}>
                {/* Student Overall Report */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Student Overall Report
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Download complete feedback analysis and scores for all students
                      </Typography>
                  <Button
                    variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('student', 'overall')}
                    fullWidth
                        sx={{ 
                          bgcolor: '#1A2137', 
                          '&:hover': { bgcolor: '#2A3147' }
                        }}
                  >
                        Download Student Overall Report
                  </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Staff Overall Report */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Staff Overall Report
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Download complete feedback analysis and scores for all staff members
                      </Typography>
                  <Button
                    variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('staff', 'overall')}
                    fullWidth
                        sx={{ 
                          bgcolor: '#1A2137', 
                          '&:hover': { bgcolor: '#2A3147' }
                        }}
                  >
                        Download Staff Overall Report
                  </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Individual Score Reports */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#1A2137' }}>
                Individual Score Reports
              </Typography>
              <Grid container spacing={3}>
                {/* Student Individual Report */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Student Individual Reports
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Download detailed individual feedback reports for students by department and year
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('student', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#1A2137', 
                          '&:hover': { bgcolor: '#2A3147' }
                        }}
                      >
                        Download Student Individual Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Staff Individual Report */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Staff Individual Reports
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Download detailed individual feedback reports for staff members by department
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReport('staff', 'individual')}
                        fullWidth
                        sx={{ 
                          bgcolor: '#1A2137', 
                          '&:hover': { bgcolor: '#2A3147' }
                        }}
                      >
                        Download Staff Individual Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render analytics section with performance charts
  const renderAnalytics = () => (
    <Paper sx={{ p: 4, borderRadius: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>Performance Analytics</Typography>
      
      <Grid container spacing={3}>
        {/* Student Performance Section */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>Student Performance</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Student Overall Performance
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, color: '#1A2137' }}>
                {performanceSummary.studentOverall}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          {renderStudentPerformanceChart()}
        </Grid>
        
        {/* Staff Performance Section */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>Staff Performance</Typography>
          </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 0, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Staff Overall Performance
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, color: '#1A2137' }}>
                {performanceSummary.staffOverall}%
              </Typography>
            </CardContent>
          </Card>
          </Grid>
        
        <Grid item xs={12}>
          {renderStaffPerformanceChart()}
        </Grid>
      </Grid>
    </Paper>
  );

  // Sidebar component
  const Sidebar = () => (
    <Box 
      sx={{
        width: 240,
        bgcolor: '#1A2137', // Dark navy blue
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1
      }}
    >
      <Box sx={{ p: 3, pb: 2, bgcolor: '#2A3147' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
          Executive Director
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        {tabs.map(tab => (
          <ListItem
            key={tab.id}
            button 
            onClick={() => setActiveSection(tab.id)}
            sx={{
              py: 2, 
              pl: 3,
              bgcolor: activeSection === tab.id ? '#2A3147' : 'transparent',
              '&:hover': { bgcolor: '#2A3147' }
            }}
          >
            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
              {tab.icon}
            </ListItemIcon>
            <ListItemText primary={tab.label} sx={{ color: '#FFFFFF' }} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            py: 2, 
            pl: 3,
            '&:hover': { bgcolor: '#2A3147' }
          }}
        >
          <ListItemIcon sx={{ color: '#FFFFFF', minWidth: 30 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#FFFFFF' }} />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Custom sidebar that matches the student dashboard */}
      <Sidebar />
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          bgcolor: '#f5f5f7',
          ml: '240px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ width: '1010px', mt: 2, mb: 2 }}>
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'meetings' && renderMeetings()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'analytics' && renderAnalytics()}
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExecutiveDirectorDashboard;