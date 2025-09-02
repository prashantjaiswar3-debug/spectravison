export type DeviceStatus = 'active' | 'inactive' | 'error';

export type Camera = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  installationDate: Date;
  status: DeviceStatus;
};

export type NVR = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  storageCapacity: string; // e.g., '8TB'
  channels: number;
};

export type POESwitch = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  portCount: number;
  powerBudget: string; // e.g., '250W'
};

export type Device = Camera | NVR | POESwitch;
