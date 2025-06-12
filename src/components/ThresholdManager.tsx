import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Volume2, Save } from 'lucide-react';
import { getAllSensors, getThresholdsForSensor, createThreshold, Threshold, Sensor } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ThresholdManager = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);
  const [thresholds, setThresholds] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSensors();
  }, []);

  useEffect(() => {
    if (selectedSensorId !== null) {
      fetchThresholds(selectedSensorId);
    }
  }, [selectedSensorId]);

  const fetchSensors = async () => {
    try {
      const data = await getAllSensors();
      setSensors(data);
      if (data.length > 0) setSelectedSensorId(data[0].id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sensors.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchThresholds = async (sensorId: number) => {
    setLoading(true);
    try {
      const data = await getThresholdsForSensor(sensorId);
      const thresholdMap: { [key: string]: number } = {};
      data.forEach((threshold: Threshold) => {
        thresholdMap[threshold.type] = threshold.level;
      });
      setThresholds(thresholdMap);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch thresholds.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (type: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 120) {
      setThresholds(prev => ({ ...prev, [type]: numValue }));
    }
  };

  const saveThresholds = async () => {
    if (selectedSensorId === null) return;
    setSaving(true);
    const selectedSensor = sensors.find(s => s.id === selectedSensorId);
    if (!selectedSensor) return;
    try {
      await Promise.all([
        createThreshold('low', thresholds.low || 40, selectedSensor.hwid),
        createThreshold('medium', thresholds.medium || 60, selectedSensor.hwid),
        createThreshold('high', thresholds.high || 80, selectedSensor.hwid),
      ]);
      toast({
        title: 'Success',
        description: 'Sound level thresholds updated successfully.',
      });
      fetchThresholds(selectedSensorId); // Refresh after save
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save thresholds.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getThresholdColor = (type: string) => {
    switch (type) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getThresholdDescription = (type: string, level: number) => {
    switch (type) {
      case 'low': return `Alert when sound exceeds ${level} dB (quiet environment threshold)`;
      case 'medium': return `Alert when sound exceeds ${level} dB (normal environment threshold)`;
      case 'high': return `Alert when sound exceeds ${level} dB (loud environment threshold)`;
      default: return `Alert when sound level exceeds ${level} dB`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Sound Level Thresholds</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mb-4">
            <Label htmlFor="sensor-select">Select Sensor:</Label>
            <select
              id="sensor-select"
              className="block w-full mt-1 p-2 border rounded"
              value={selectedSensorId ?? ''}
              onChange={e => setSelectedSensorId(Number(e.target.value))}
            >
              {sensors.map(sensor => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.hwid} {sensor.location ? `(${sensor.location})` : ''}
                </option>
              ))}
            </select>
            {selectedSensorId !== null && (
              <div className="mt-2 text-sm text-muted-foreground">
                <strong>Location:</strong> {sensors.find(s => s.id === selectedSensorId)?.location || 'N/A'}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Sound Level Reference:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>• 0-30 dB: Very Quiet</div>
              <div>• 30-50 dB: Quiet</div>
              <div>• 50-70 dB: Moderate</div>
              <div>• 70-90 dB: Loud</div>
              <div>• 90+ dB: Very Loud</div>
              <div>• 120+ dB: Harmful</div>
            </div>
          </div>

          <div className="space-y-4">
            {['low', 'medium', 'high'].map(type => (
              <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant={getThresholdColor(type)}>
                    {type.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {type.charAt(0).toUpperCase() + type.slice(1)} Threshold
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getThresholdDescription(type, thresholds[type] || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`${type}-threshold`} className="text-sm">
                    Level:
                  </Label>
                  <Input
                    id={`${type}-threshold`}
                    type="number"
                    value={thresholds[type] || ''}
                    onChange={e => handleThresholdChange(type, e.target.value)}
                    min="0"
                    max="120"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">dB</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveThresholds} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Thresholds'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThresholdManager;
