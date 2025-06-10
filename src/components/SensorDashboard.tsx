
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Volume2, RefreshCw } from 'lucide-react';
import { getAllSensors, getSensorReadings, getSensorAverage, getAllThresholds } from '@/lib/api';
import { Sensor, SensorReading, Threshold } from '@/lib/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';

const SensorDashboard = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [thresholds, setThresholds] = useState<{ [key: string]: number }>({
    low: 40,
    medium: 60,
    high: 80
  });
  const [loading, setLoading] = useState(true);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('5m');
  const [averageReading, setAverageReading] = useState<number | null>(null);
  const [loadingAverage, setLoadingAverage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { isSupported, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  const timeframes = [
    { label: '5 minutes', value: '5m', seconds: 300 },
    { label: '15 minutes', value: '15m', seconds: 900 },
    { label: '30 minutes', value: '30m', seconds: 1800 },
    { label: '1 hour', value: '1h', seconds: 3600 },
    { label: '6 hours', value: '6h', seconds: 21600 },
    { label: '24 hours', value: '24h', seconds: 86400 }
  ];

  useEffect(() => {
    fetchSensors();
    fetchThresholds();
  }, []);

  useEffect(() => {
    if (selectedSensor) {
      fetchSensorReadings(selectedSensor);
      if (selectedTimeframe) {
        fetchAverageReading();
      }
    }
  }, [selectedSensor, selectedTimeframe]);

  // Auto-refresh readings every 5 seconds for selected sensor
  useEffect(() => {
    if (!selectedSensor) return;

    const interval = setInterval(() => {
      // Use silent refresh to avoid loading states during auto-refresh
      fetchSensorReadings(selectedSensor, true);
      if (selectedTimeframe) {
        fetchAverageReading();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedSensor, selectedTimeframe]);

  const fetchSensors = async () => {
    try {
      const sensorsData = await getAllSensors();
      setSensors(sensorsData);
      
      if (sensorsData.length > 0 && !selectedSensor) {
        setSelectedSensor(sensorsData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sensors. Using demo data.",
        variant: "destructive",
      });
      
      // Fallback to demo data
      const demoSensors: Sensor[] = [
        { id: 1, hwid: "SOUND001" },
        { id: 2, hwid: "SOUND002" },
        { id: 3, hwid: "SOUND003" }
      ];
      setSensors(demoSensors);
      if (!selectedSensor) {
        setSelectedSensor(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      const data = await getAllThresholds();
      
      // Convert array to object for easier management
      const thresholdMap: { [key: string]: number } = {};
      if (Array.isArray(data)) {
        data.forEach((threshold: Threshold) => {
          if (threshold && typeof threshold.type === 'string' && typeof threshold.level === 'number') {
            thresholdMap[threshold.type] = threshold.level;
          }
        });
      }
      
      // Set thresholds with fallback to defaults
      setThresholds({
        low: thresholdMap.low || 40,
        medium: thresholdMap.medium || 60,
        high: thresholdMap.high || 80
      });
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
      // Keep default values if fetching fails
    }
  };

  const fetchSensorReadings = async (sensorId: number, silent: boolean = false) => {
    if (!silent) {
      setLoadingReadings(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const readings = await getSensorReadings(sensorId);
      setSensorReadings(readings);
    } catch (error) {
      console.error('Failed to fetch sensor readings:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch sensor readings.",
          variant: "destructive",
        });
      }
      setSensorReadings([]);
    } finally {
      if (!silent) {
        setLoadingReadings(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const fetchAverageReading = async () => {
    if (!selectedSensor) return;
    
    setLoadingAverage(true);
    try {
      const timeframe = timeframes.find(t => t.value === selectedTimeframe);
      if (timeframe) {
        const result = await getSensorAverage(selectedSensor, timeframe.seconds);
        setAverageReading(result.average);
      }
    } catch (error) {
      console.error('Failed to fetch average reading:', error);
      // Generate demo average based on current reading
      const currentReading = sensorReadings.find(r => r.sensor.id === selectedSensor);
      if (currentReading) {
        const variation = Math.random() * 10 - 5; // ±5 variation
        setAverageReading(Math.max(0, currentReading.level + variation));
      }
    } finally {
      setLoadingAverage(false);
    }
  };

  const getStatusColor = (level: number) => {
    if (level > thresholds.high) return 'destructive'; // High noise
    if (level > thresholds.medium) return 'secondary'; // Medium noise
    return 'default'; // Low noise
  };

  const getStatusLabel = (level: number) => {
    if (level > thresholds.high) return 'High';
    if (level > thresholds.medium) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sound sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sound Monitor</h1>
          <p className="text-muted-foreground">Real-time sound level monitoring dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          {isSupported && (
            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={pushLoading}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
            >
              {isSubscribed ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {pushLoading ? 'Loading...' : isSubscribed ? 'Disable Alerts' : 'Enable Alerts'}
            </Button>
          )}
          <Button onClick={() => {
            fetchSensors();
            fetchThresholds();
            if (selectedSensor) {
              fetchSensorReadings(selectedSensor);
            }
          }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Available Sensors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Available Sensors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map((sensor) => (
              <Card 
                key={sensor.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedSensor === sensor.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSensor(sensor.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {sensor.hwid}
                  </CardTitle>
                  <Badge variant={selectedSensor === sensor.id ? "default" : "outline"}>
                    {selectedSensor === sensor.id ? 'Selected' : 'Available'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    ID: {sensor.id}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to view readings
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Readings */}
      {selectedSensor && (
        <Card>
                     <CardHeader>
             <CardTitle className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <Volume2 className="h-5 w-5" />
                 <span>Readings for {sensors.find(s => s.id === selectedSensor)?.hwid}</span>
               </div>
               {isRefreshing && (
                 <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                   <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                   <span>Updating...</span>
                 </div>
               )}
             </CardTitle>
           </CardHeader>
          <CardContent>
            {loadingReadings ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sensorReadings.length > 0 ? (
              <div className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {sensorReadings.slice(0, 6).map((reading) => (
                     <div key={reading.id} className="p-4 border rounded-lg transition-all duration-500 ease-in-out hover:shadow-md">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-2xl font-bold transition-all duration-300 ease-in-out">{reading.level} dB</span>
                         <Badge variant={getStatusColor(reading.level)} className="transition-all duration-300 ease-in-out">
                           {getStatusLabel(reading.level)}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground transition-opacity duration-300">
                         {new Date(reading.readedAt).toLocaleString()}
                       </p>
                     </div>
                   ))}
                </div>
                {sensorReadings.length > 6 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing latest 6 readings of {sensorReadings.length} total
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No readings available for this sensor</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Average Readings */}
      {selectedSensor && (
        <Card>
          <CardHeader>
            <CardTitle>
              Average Readings - {sensors.find(s => s.id === selectedSensor)?.hwid}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {timeframes.map((timeframe) => (
                  <Button
                    key={timeframe.value}
                    variant={selectedTimeframe === timeframe.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                  >
                    {timeframe.label}
                  </Button>
                ))}
              </div>
              
              <div className="p-4 bg-muted rounded-lg transition-all duration-300 ease-in-out">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2 transition-all duration-500 ease-in-out">
                    {loadingAverage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      `${averageReading?.toFixed(1) || 'N/A'} dB`
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground transition-opacity duration-300">
                    Average over {timeframes.find(t => t.value === selectedTimeframe)?.label.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Push Notifications</span>
              <Badge variant={isSubscribed ? "default" : "secondary"}>
                {isSubscribed ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Sensors</span>
              <Badge variant="default">{sensors.length}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Sensor</span>
              <Badge variant="default">
                {selectedSensor ? sensors.find(s => s.id === selectedSensor)?.hwid || `ID: ${selectedSensor}` : 'None'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Readings for Selected</span>
              <Badge variant="default">{selectedSensor ? sensorReadings.length : 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorDashboard;
