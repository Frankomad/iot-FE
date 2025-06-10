
const API_BASE = 'http://localhost:8000'; // Replace with your actual API endpoint

export interface Sensor {
  id: number;
  hwid: string;
}

export interface SensorReading {
  id: number;
  level: number;
  readedAt: string;
  sensor: Sensor;
}

export interface Threshold {
  id: number;
  type: string;
  level: number;
}

export interface PushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Push notification API
export const subscribeToPush = async (endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> => {
  const response = await fetch(`${API_BASE}/api/v1/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint, p256dh, auth }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to subscribe to push notifications');
  }
  
  return response.json();
};

// Threshold API
export const getAllThresholds = async (): Promise<Threshold[]> => {
  const response = await fetch(`${API_BASE}/api/v1/threshold/all`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch thresholds');
  }
  
  return response.json();
};

export const createThreshold = async (type: string, level: number): Promise<Threshold> => {
  const response = await fetch(`${API_BASE}/api/v1/threshold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, level }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create threshold');
  }
  
  return response.json();
};

// Sensor API
export const getAllSensors = async (): Promise<Sensor[]> => {
  const response = await fetch(`${API_BASE}/api/v1/sensor/all`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sensors');
  }
  
  return response.json();
};

// Sensor reading API
export const getAllSensorReadings = async (): Promise<SensorReading[]> => {
  const response = await fetch(`${API_BASE}/api/v1/sensorReading/all`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sensor readings');
  }
  
  return response.json();
};

export const getSensorReading = async (sensorId: number): Promise<SensorReading> => {
  const response = await fetch(`${API_BASE}/api/v1/sensorReading/${sensorId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sensor reading');
  }
  
  return response.json();
};

export const getSensorReadings = async (sensorId: number): Promise<SensorReading[]> => {
  const response = await fetch(`${API_BASE}/api/v1/sensorReading/${sensorId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sensor readings');
  }
  
  const data = await response.json();
  
  // If the API returns a single reading object, wrap it in an array
  // If it returns an array, return as is
  return Array.isArray(data) ? data : [data];
};

export const getSensorAverage = async (sensorId: number, inLastSeconds: number): Promise<{ average: number }> => {
  const response = await fetch(`${API_BASE}/api/v1/sensorReading/${sensorId}/average/${inLastSeconds}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sensor average');
  }
  
  return response.json();
};
