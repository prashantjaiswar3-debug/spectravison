export type DeviceStatus = 'active' | 'inactive' | 'error';
export type DeviceType = 'camera' | 'nvr' | 'poe' | 'tv';

export interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

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
  zoneId?: string;
  poeSwitchId: string;
  poePortNumber: number;
  cameraType: 'bullet' | 'dome' | 'ptz';
  quality: number; // in megapixels
  nvrId: string;
  nvrChannelNumber: number;
  locationId?: string;
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
  locationId?: string;
};

export type POESwitch = {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  portCount: number;
  powerBudget: string; // e.g., '250W'
  type: 'poe';
  derivedStatus?: DeviceStatus;
  hasInactiveCameras?: boolean;
  locationId?: string;
};

export type TVScreen = {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  ipAddress: string;
  size: number; // e.g., 55
  type: 'tv';
  nvrId: string;
  locationId?: string;
};

export type Device = Camera | NVR | POESwitch | TVScreen;
