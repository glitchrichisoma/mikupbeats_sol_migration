import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Eye,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddExcludedVisitor,
  useGetAnalytics,
  useIsExcludedVisitor,
  useRemoveExcludedVisitor,
} from "../hooks/useQueries";

export default function AnalyticsSection() {
  const { data: analytics, isLoading, error } = useGetAnalytics();
  const { identity } = useInternetIdentity();
  const [isToggling, setIsToggling] = useState(false);

  const principal = identity?.getPrincipal();
  const { data: isExcluded, isLoading: isExcludedLoading } =
    useIsExcludedVisitor(principal!);
  const addExcluded = useAddExcludedVisitor();
  const removeExcluded = useRemoveExcludedVisitor();

  const handleToggleExclusion = async () => {
    if (!principal) return;
    setIsToggling(true);
    try {
      if (isExcluded) {
        await removeExcluded.mutateAsync(principal);
      } else {
        await addExcluded.mutateAsync(principal);
      }
    } catch (error) {
      console.error("Failed to toggle exclusion:", error);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Analytics Dashboard
            </CardTitle>
            <CardDescription>Loading analytics data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm border-destructive/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Analytics Dashboard
            </CardTitle>
            <CardDescription className="text-destructive">
              Failed to load analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normalize analytics data with safe defaults
  const safeAnalytics = {
    totalVisits: analytics?.totalVisits ?? BigInt(0),
    uniqueVisitors: analytics?.uniqueVisitors ?? BigInt(0),
    dailyVisits: analytics?.dailyVisits ?? [],
    pageVisits: {
      store: analytics?.pageVisits?.store ?? BigInt(0),
      showcase: analytics?.pageVisits?.showcase ?? BigInt(0),
      mva: analytics?.pageVisits?.mva ?? BigInt(0),
      live: analytics?.pageVisits?.live ?? BigInt(0),
      forum: analytics?.pageVisits?.forum ?? BigInt(0),
      musicLinks: analytics?.pageVisits?.musicLinks ?? BigInt(0),
      mixtapes: analytics?.pageVisits?.mixtapes ?? BigInt(0),
    },
  };

  const totalVisits = Number(safeAnalytics.totalVisits);
  const uniqueVisitors = Number(safeAnalytics.uniqueVisitors);

  // Prepare chart data for daily visits
  const chartData = safeAnalytics.dailyVisits.map((visit) => ({
    date: visit.date,
    visits: Number(visit.count),
  }));

  // Page-specific data
  const pageData = [
    {
      name: "Store",
      visits: Number(safeAnalytics.pageVisits.store),
      icon: BarChart3,
      color: "#a970ff",
    },
    {
      name: "Showcase",
      visits: Number(safeAnalytics.pageVisits.showcase),
      icon: TrendingUp,
      color: "#8b5cf6",
    },
    {
      name: "M.v.A",
      visits: Number(safeAnalytics.pageVisits.mva),
      icon: Eye,
      color: "#7c3aed",
    },
    {
      name: "Live",
      visits: Number(safeAnalytics.pageVisits.live),
      icon: Users,
      color: "#6d28d9",
    },
    {
      name: "Forum",
      visits: Number(safeAnalytics.pageVisits.forum),
      icon: BarChart3,
      color: "#5b21b6",
    },
    {
      name: "Music Links",
      visits: Number(safeAnalytics.pageVisits.musicLinks),
      icon: TrendingUp,
      color: "#4c1d95",
    },
    {
      name: "Mixtapes",
      visits: Number(safeAnalytics.pageVisits.mixtapes),
      icon: Eye,
      color: "#3b0764",
    },
  ];

  // Shortened principal display
  const principalText = principal ? principal.toString() : "";
  const shortPrincipal =
    principalText.length > 20
      ? `${principalText.slice(0, 10)}...${principalText.slice(-10)}`
      : principalText;

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Real-time site visit tracking and data visualization
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Exclusion Control */}
      {principal ? (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">
              Your Visit Tracking
            </CardTitle>
            <CardDescription>
              Control whether your visits are counted in analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Your Principal:</span>{" "}
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {shortPrincipal}
                  </code>
                </div>
                {!isExcludedLoading && (
                  <Badge
                    variant={isExcluded ? "secondary" : "default"}
                    className="flex items-center gap-1"
                  >
                    {isExcluded ? (
                      <>
                        <UserX className="h-3 w-3" />
                        Excluded
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" />
                        Included
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleToggleExclusion}
                disabled={isToggling || isExcludedLoading}
                variant={isExcluded ? "default" : "secondary"}
                size="sm"
              >
                {isToggling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Updating...
                  </>
                ) : isExcluded ? (
                  "Include my visits in analytics"
                ) : (
                  "Exclude my visits from analytics"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isExcluded
                ? "Your visits are currently excluded from all analytics counts. Click above to start tracking your activity."
                : "Your visits are currently included in analytics. Click above to exclude your activity from all counts."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">
              Your Visit Tracking
            </CardTitle>
            <CardDescription>
              Control whether your visits are counted in analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You must be logged in as an admin to exclude your visits from
              analytics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* All Traffic Summary Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-primary">All Traffic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Site Visits
              </CardTitle>
              <Eye className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {totalVisits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All-time visits across the platform
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Visitors
              </CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">
                {uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Unique users tracked
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Excluding Me Summary - Note: Backend currently returns same data for both */}
      {principal && isExcluded && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary">Excluding Me</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-secondary/10 to-muted/10 border-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Site Visits
                </CardTitle>
                <Eye className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-secondary">
                  {totalVisits.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Visits excluding your activity
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted/10 to-secondary/10 border-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Visitors
                </CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-muted-foreground">
                  {uniqueVisitors.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unique users excluding you
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Page-Specific Analytics - All Traffic */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">
            Page-Specific Analytics (All Traffic)
          </CardTitle>
          <CardDescription>Visit counts for each major page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageData.map((page) => {
              const Icon = page.icon;
              return (
                <Card key={page.name} className="bg-card/50 border-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {page.name}
                    </CardTitle>
                    <Icon className="h-4 w-4" style={{ color: page.color }} />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: page.color }}
                    >
                      {page.visits.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">visits</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Page-Specific Analytics - Excluding Me */}
      {principal && isExcluded && (
        <Card className="bg-card/80 backdrop-blur-sm border-secondary/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-secondary">
              Page-Specific Analytics (Excluding Me)
            </CardTitle>
            <CardDescription>
              Visit counts excluding your activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageData.map((page) => {
                const Icon = page.icon;
                return (
                  <Card
                    key={page.name}
                    className="bg-card/50 border-secondary/10"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {page.name}
                      </CardTitle>
                      <Icon className="h-4 w-4" style={{ color: page.color }} />
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: page.color }}
                      >
                        {page.visits.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        visits (excluding you)
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Visualization */}
      {chartData.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">
              Visit Trends
            </CardTitle>
            <CardDescription>Daily visit patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#a970ff"
                    strokeWidth={2}
                    dot={{ fill: "#a970ff", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Daily Visits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">
              Visit Trends
            </CardTitle>
            <CardDescription>Daily visit patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                No trend data available yet. Visit data will appear here over
                time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
