
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Volume2, Save } from 'lucide-react';
import { getAllThresholds, createThreshold, Threshold } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ThresholdManager = () => {
  const [thresholds, setThresholds] = useState<{ [key: string]: number }>({
    lowThreshold: 40,
    mediumThreshold: 60,
    highThreshold: 80
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThresholds();
  }, []);

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
      
      // Ensure we have all three types with default values
      setThresholds({
        lowThreshold: thresholdMap.low || 40,
        mediumThreshold: thresholdMap.medium || 60,
        highThreshold: thresholdMap.high || 80
      });
      
      // Success - no error toast needed
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
      
      // Set default values when there's an actual error
      setThresholds({
        lowThreshold: 40,
        mediumThreshold: 60,
        highThreshold: 80
      });
      
      // Show error toast only for actual API/network errors
      toast({
        title: "Error",
        description: "Failed to fetch thresholds. Using default values.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (type: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 120) {
      setThresholds(prev => ({
        ...prev,
        [type]: numValue
      }));
    }
  };

  const saveThresholds = async () => {
    setSaving(true);
    try {
      // Save all three thresholds
      await Promise.all([
        createThreshold('low', thresholds.lowThreshold),
        createThreshold('medium', thresholds.mediumThreshold),
        createThreshold('high', thresholds.highThreshold)
      ]);
      
      toast({
        title: "Success",
        description: "Sound level thresholds updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to save thresholds.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getThresholdColor = (type: string) => {
    switch (type) {
      case 'lowThreshold':
        return 'default';
      case 'mediumThreshold':
        return 'secondary';
      case 'highThreshold':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getThresholdDescription = (type: string, level: number) => {
    switch (type) {
      case 'lowThreshold':
        return `Alert when sound exceeds ${level} dB (quiet environment threshold)`;
      case 'mediumThreshold':
        return `Alert when sound exceeds ${level} dB (normal environment threshold)`;
      case 'highThreshold':
        return `Alert when sound exceeds ${level} dB (loud environment threshold)`;
      default:
        return `Alert when sound level exceeds ${level} dB`;
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
            {Object.entries(thresholds).map(([type, level]) => (
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
                      {getThresholdDescription(type, level)}
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
                    value={level}
                    onChange={(e) => handleThresholdChange(type, e.target.value)}
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
