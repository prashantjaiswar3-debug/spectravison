export type DeviceStatus = 'active' | 'inactive' | 'error';
export type DeviceType = 'camera' | 'nvr' | 'poe' | 'tv';

export type Camera = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  installationDate: Date;
  status: DeviceStatus;
  type: 'camera';
  screenChannelNumber: number;
  zone: string;
  poeSwitchId: string;
  poePortNumber: number;
};

export type NVR = {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  storageCapacity: string; // e.g., '8TB'
  channels: number;
  type: 'nvr';
};

export type POESwitch = {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  portCount: number;
  powerBudget: string; // e.g., '250W'
  type: 'poe';
};

export type TVScreen = {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  ipAddress: string;
  size: number; // e.g., 55
  type: 'tv';
};

export type Device = Camera | NVR | POESwitch | TVScreen;
