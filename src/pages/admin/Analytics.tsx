import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Package, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  totalBatches: number;
  totalReports: number;
  totalVerifications: number;
  recentActivity: any[];
  usersByRole: { [key: string]: number };
  reportsByStatus: { [key: string]: number };
  verificationTrends: any[];
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBatches: 0,
    totalReports: 0,
    totalVerifications: 0,
    recentActivity: [],
    usersByRole: {},
    reportsByStatus: {},
    verificationTrends: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total counts
      const [usersResult, batchesResult, reportsResult, verificationsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('batches').select('id', { count: 'exact' }),
        supabase.from('counterfeit_reports').select('id', { count: 'exact' }),
        supabase.from('verification_logs').select('id', { count: 'exact' })
      ]);

      // Fetch users by role
      const { data: userRoles } = await supabase
        .from('profiles')
        .select('role');

      const usersByRole = userRoles?.reduce((acc: { [key: string]: number }, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {};

      // Fetch reports by status
      const { data: reportStatuses } = await supabase
        .from('counterfeit_reports')
        .select('status');

      const reportsByStatus = reportStatuses?.reduce((acc: { [key: string]: number }, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Fetch recent verification activity
      const { data: recentActivity } = await supabase
        .from('verification_logs')
        .select(`
          *,
          batches (
            batch_number,
            medicines (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch verification trends (last 7 days)
      const { data: verificationTrends } = await supabase
        .from('verification_logs')
        .select('created_at, verification_result')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      setAnalytics({
        totalUsers: usersResult.count || 0,
        totalBatches: batchesResult.count || 0,
        totalReports: reportsResult.count || 0,
        totalVerifications: verificationsResult.count || 0,
        recentActivity: recentActivity || [],
        usersByRole,
        reportsByStatus,
        verificationTrends: verificationTrends || []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground">View system-wide analytics and reports</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBatches}</div>
              <p className="text-xs text-muted-foreground">
                Medicine batches created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Counterfeit Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                Total reports submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifications</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalVerifications}</div>
              <p className="text-xs text-muted-foreground">
                Total verifications
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Users by Role */}
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of users across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="capitalize font-medium">{role}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reports by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Reports by Status</CardTitle>
              <CardDescription>Breakdown of counterfeit reports by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.reportsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'investigating' ? 'bg-blue-500' :
                        status === 'resolved' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="capitalize font-medium">{status}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Verification Activity</span>
            </CardTitle>
            <CardDescription>Latest medicine verification attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                analytics.recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.verification_result === 'authentic' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : activity.verification_result === 'not_found' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {activity.batches?.medicines?.name || 'Unknown Medicine'}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Batch: {activity.batches?.batch_number || 'Unknown'} • 
                        Result: {activity.verification_result} • 
                        Location: {activity.location || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}