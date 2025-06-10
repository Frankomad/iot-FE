
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SensorDashboard from '@/components/SensorDashboard';
import ThresholdManager from '@/components/ThresholdManager';
import { Volume2, Settings, Bell } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Sound Monitor PWA
          </h1>
          <p className="text-center text-muted-foreground">
            Real-time sound level monitoring with intelligent noise alerts
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Thresholds</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <SensorDashboard />
          </TabsContent>

          <TabsContent value="thresholds">
            <ThresholdManager />
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Push notifications are sent automatically when sound levels exceed your configured thresholds.
                    Monitor noise pollution, protect quiet zones, and stay informed about sound levels in real-time.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Set sound level thresholds for different zones</li>
                      <li>Enable push notifications in the dashboard</li>
                      <li>Receive instant alerts when noise levels are exceeded</li>
                      <li>Click notifications to view detailed sound data</li>
                      <li>Monitor trends to identify noise pollution patterns</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Sound Level Guidelines:</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      <li>Quiet zones: Usually 30-40 dB (libraries, bedrooms)</li>
                      <li>Normal areas: 40-60 dB (offices, homes)</li>
                      <li>Active areas: 60-80 dB (restaurants, busy streets)</li>
                      <li>Loud areas: 80+ dB (construction, concerts)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
