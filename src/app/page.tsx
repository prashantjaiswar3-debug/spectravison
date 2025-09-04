

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Camera,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Server,
  Network as SwitchIcon,
  Wifi,
  WifiOff,
  Tv2,
  Printer,
  QrCode,
  ListTree,
  Share2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

import type { Camera as CameraType, NVR, POESwitch, Device, DeviceStatus, TVScreen, DeviceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { DeviceForm } from '@/components/device-forms/DeviceForm';
import { getDeviceFormSchema, type DeviceFormValues } from '@/components/device-forms/schemas';


const initialCameras: CameraType[] = [
  { id: 'a1b2c3d4', type: 'camera', name: 'Lobby Cam 1', ipAddress: '192.168.1.101', location: 'Main Lobby', installationDate: new Date('2023-01-15'), status: 'active', screenChannelNumber: 1, zone: 'A', poeSwitchId: 'poe1', poePortNumber: 1, cameraType: 'dome', quality: 4, nvrId: 'nvr1', nvrChannelNumber: 1 },
  { id: 'e5f6g7h8', type: 'camera', name: 'Parking Lot Cam', ipAddress: '192.168.1.102', location: 'Exterior Parking', installationDate: new Date('2022-11-20'), status: 'inactive', screenChannelNumber: 2, zone: 'C', poeSwitchId: 'poe1', poePortNumber: 2, cameraType: 'bullet', quality: 5, nvrId: 'nvr1', nvrChannelNumber: 2 },
  { id: 'i9j0k1l2', type: 'camera', name: 'Office Cam 204', ipAddress: '192.168.2.55', location: 'Second Floor, Office 204', installationDate: new Date('2023-05-10'), status: 'active', screenChannelNumber: 3, zone: 'B', poeSwitchId: 'poe2', poePortNumber: 5, cameraType: 'ptz', quality: 8, nvrId: 'nvr2', nvrChannelNumber: 1 },
  { id: 'm3n4o5p6', type: 'camera', name: 'Rooftop East', ipAddress: '192.168.1.108', location: 'Rooftop', installationDate: new Date('2021-08-01'), status: 'error', screenChannelNumber: 4, zone: 'C', poeSwitchId: 'poe2', poePortNumber: 8, cameraType: 'bullet', quality: 3, nvrId: 'nvr2', nvrChannelNumber: 4 },
];

const initialNVRs: NVR[] = [
  { id: 'nvr1', type: 'nvr', name: 'Main NVR', ipAddress: '192.168.1.50', location: 'Server Room', status: 'active', storageCapacity: '16TB', channels: 16 },
  { id: 'nvr2', type: 'nvr', name: 'Backup NVR', ipAddress: '192.168.1.51', location: 'Server Room', status: 'inactive', storageCapacity: '8TB', channels: 8 },
];

const initialPOESwitches: POESwitch[] = [
  { id: 'poe1', type: 'poe', name: 'Lobby Switch', location: '1st Floor IT Closet', status: 'active', portCount: 8, uplinkPortCount: 2 },
  { id: 'poe2', type: 'poe', name: 'Office Switch', location: '2nd Floor IT Closet', status: 'active', portCount: 16, uplinkPortCount: 2 },
  { id: 'poe3', type: 'poe', name: 'Warehouse Switch', location: 'Unassigned', status: 'active', portCount: 8 },
];

const initialTVScreens: TVScreen[] = [
    { id: 'tv1', type: 'tv', name: 'Lobby TV', location: 'Main Lobby', size: 55, nvrId: 'nvr1' },
    { id: 'tv2', type: 'tv', name: 'Break Room TV', location: 'Break Room', size: 65, nvrId: 'nvr2' },
];

export default function Home() {
  const [cameras, setCameras] = useState<CameraType[]>(initialCameras);
  const [nvrs, setNvrs] = useState<NVR[]>(initialNVRs);
  const [poeSwitches, setPoeSwitches] = useState<POESwitch[]>(initialPOESwitches);
  const [tvScreens, setTvScreens] = useState<TVScreen[]>(initialTVScreens);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [stickerDevice, setStickerDevice] = useState<Device | null>(null);
  const [connectionCamera, setConnectionCamera] = useState<CameraType | null>(null);
  const [formDeviceType, setFormDeviceType] = useState<DeviceType | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  const { toast } = useToast();
  const stickerRef = useRef<HTMLDivElement>(null);

  const derivedPoeSwitches = useMemo(() => {
    return poeSwitches.map(sw => {
        const connectedCameras = cameras.filter(cam => cam.poeSwitchId === sw.id);
        if (connectedCameras.length === 0) {
            return { ...sw, derivedStatus: sw.status, hasInactiveCameras: false };
        }

        const hasErrorCamera = connectedCameras.some(cam => cam.status === 'error');
        if (hasErrorCamera) {
            return { ...sw, derivedStatus: 'error' as DeviceStatus, hasInactiveCameras: false };
        }

        const allCamerasInactive = connectedCameras.every(cam => cam.status === 'inactive');
        if (allCamerasInactive) {
            return { ...sw, derivedStatus: 'inactive' as DeviceStatus, hasInactiveCameras: true };
        }
        
        const hasActiveCamera = connectedCameras.some(cam => cam.status === 'active');
        if (hasActiveCamera) {
            return { ...sw, derivedStatus: 'active' as DeviceStatus, hasInactiveCameras: false };
        }

        return { ...sw, derivedStatus: sw.status, hasInactiveCameras: false };
    });
  }, [poeSwitches, cameras]);

  const allDevices: Device[] = useMemo(() => [...cameras, ...nvrs, ...derivedPoeSwitches, ...tvScreens], [cameras, nvrs, derivedPoeSwitches, tvScreens]);

  const poeSwitchMap = useMemo(() => poeSwitches.reduce((acc, sw) => ({ ...acc, [sw.id]: sw }), {} as Record<string, POESwitch>), [poeSwitches]);
  const nvrMap = useMemo(() => nvrs.reduce((acc, nvr) => ({ ...acc, [nvr.id]: nvr }), {} as Record<string, NVR>), [nvrs]);
  
  const updateDeviceById = useCallback((id: string, updates: Partial<Device>) => {
    const updater = (prev: any[]) => prev.map(d => d.id === id ? { ...d, ...updates } : d);
    setCameras(updater);
    setNvrs(updater);
    setPoeSwitches(updater);
    setTvScreens(updater);
  }, []);

  const handlePing = useCallback((device: Device, isAutomatic: boolean = false) => {
    if (!('ipAddress' in device) || !device.ipAddress) {
        if (!isAutomatic) {
             toast({
                title: `Ping ${device.name}`,
                description: `This device does not have an IP address to ping.`,
                variant: 'destructive',
            });
        }
        return;
    }
    if (!('status' in device)) return;
    setPinging(prev => ({...prev, [device.id]: true}));
    
    setTimeout(() => {
        const isNowActive = Math.random() > 0.2; // 80% chance to recover from error
        const newStatus = isNowActive ? 'active' : 'error';
        
        updateDeviceById(device.id, { status: newStatus });
        
        setPinging(prev => ({...prev, [device.id]: false}));

        if (!isAutomatic) {
            toast({
                title: `Ping ${device.name}`,
                description: `Device is now ${newStatus}.`,
                variant: newStatus === 'error' ? 'default' : 'default',
            });
        }
    }, 1000 + Math.random() * 1000);
  }, [updateDeviceById, toast]);

  useEffect(() => {
    const pingInterval = setInterval(() => {
        allDevices.forEach(device => {
            if ('status' in device && device.status === 'error') {
                handlePing(device, true);
            }
        });
    }, 10000); // Ping error devices every 10 seconds

    return () => clearInterval(pingInterval);
  }, [allDevices, handlePing]);


  const handleFormSubmit = (values: DeviceFormValues) => {
    const finalValues: any = { ...values };
    
    if (editingDevice) {
      updateDeviceById(editingDevice.id, finalValues);
      toast({ title: 'Device Updated', description: `Successfully updated ${finalValues.name}.` });
    } else {
      let newDevice: Device;
      const id = crypto.randomUUID();
      if (finalValues.deviceType === 'tv') {
        newDevice = {
          ...finalValues,
          id,
        } as TVScreen;
      } else {
        newDevice = {
          ...finalValues,
          id,
          status: 'active',
        } as CameraType | NVR | POESwitch;
      }


      switch(newDevice.type) {
        case 'camera':
          setCameras(prev => [...prev, newDevice as CameraType]);
          break;
        case 'nvr':
          setNvrs(prev => [...prev, newDevice as NVR]);
          break;
        case 'poe':
          setPoeSwitches(prev => [...prev, newDevice as POESwitch]);
          break;
        case 'tv':
          setTvScreens(prev => [...prev, newDevice as TVScreen]);
          break;
      }
      toast({ title: 'Device Added', description: `Successfully added ${finalValues.name}.` });
    }
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  const handleEdit = (device: Device) => {
    // Find the original device to edit from the state, not the derived one
    const originalDevice = allDevices.find(d => d.id === device.id);
    if(originalDevice) {
      setFormDeviceType(originalDevice.type);
      setEditingDevice(originalDevice);
    }
    setIsFormOpen(true);
  };

  const handleAddNew = (type: DeviceType) => {
    setEditingDevice(null);
    setFormDeviceType(type);
    setIsFormOpen(true);
  }

  const handleDelete = (id: string, type: DeviceType) => {
    switch(type) {
        case 'camera': setCameras(cameras.filter((c) => c.id !== id)); break;
        case 'nvr': setNvrs(nvrs.filter((n) => n.id !== id)); break;
        case 'poe': setPoeSwitches(poeSwitches.filter((p) => p.id !== id)); break;
        case 'tv': setTvScreens(tvScreens.filter((t) => t.id !== id)); break;
    }
    toast({ title: 'Device Deleted', variant: 'destructive' });
  };

  const handleStatusChange = (device: Device, newStatus: boolean) => {
    const status = newStatus ? 'active' : 'inactive';
    updateDeviceById(device.id, { status });
  };

  const handlePrintSticker = () => {
    const printWindow = window.open('', '_blank', 'height=400,width=600');
    if (printWindow && stickerRef.current) {
        printWindow.document.write('<html><head><title>Print Sticker</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } @page { size: 3.5in 2in; margin: 0; } } body { margin: 0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100%; } .sticker { width: 336px; height: 192px; box-sizing: border-box; border: 1px solid #000; padding: 0; display: flex; flex-direction: column; background: white; color: black; } .header { text-align: center; padding: 8px; border-bottom: 2px solid #000; } .title { font-weight: bold; font-size: 1.5rem; } .location { font-size: 0.9rem; } .details-grid { display: grid; grid-template-columns: 1fr 1fr; flex-grow: 1; } .detail-item { padding: 4px 8px; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; font-size: 0.9rem; } .detail-item:nth-child(2n) { border-right: 0; } .detail-item:nth-last-child(1), .detail-item:nth-last-child(2) { border-bottom: 0; } .detail-key { font-weight: bold; } </style>');
        printWindow.document.write('</head><body style="margin: 0; font-family: sans-serif;">');
        printWindow.document.write(stickerRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
    }
  };

  const handlePrintAllStickers = () => {
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>All Device Stickers</title>');
      printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } } body { font-family: sans-serif; } .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(336px, 1fr)); gap: 0.5rem; } .sticker { width: 336px; height: 192px; box-sizing: border-box; border: 1px solid #000; padding: 0; display: flex; flex-direction: column; page-break-inside: avoid; background: white; color: black; } .header { text-align: center; padding: 8px; border-bottom: 2px solid #000; } .title { font-weight: bold; font-size: 1.5rem; } .location { font-size: 0.9rem; } .details-grid { display: grid; grid-template-columns: 1fr 1fr; flex-grow: 1; } .detail-item { padding: 4px 8px; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; font-size: 0.9rem; } .detail-item:nth-child(2n) { border-right: 0; } .detail-item:nth-last-child(1), .detail-item:nth-last-child(2) { border-bottom: 0; } .detail-key { font-weight: bold; } </style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>All Device Stickers</h1><div class="grid">');

      allDevices.forEach(device => {
        printWindow.document.write(
          `<div class="sticker">
             ${renderDeviceSticker(device)}
          </div>`
        );
      });
      
      printWindow.document.write('</div></body></html>');
      printWindow.document.close();
      printWindow.focus();
    }
  };
  
  const renderDeviceSticker = (device: Device | null): string => {
    if (!device) return '';
    const poeSwitchName = (id: string) => poeSwitchMap[id]?.name || 'N/A';
    const nvrName = (id: string) => nvrMap[id]?.name || 'N/A';

    const getDetails = (d: Device) => {
        let details: Record<string, any> = { ID: d.id.substring(0, 8).toUpperCase() };
        if ('ipAddress' in d && d.ipAddress) details['IP'] = d.ipAddress;
        
        switch (d.type) {
            case 'camera':
                details = { ...details, NVR: `${nvrName(d.nvrId)}:${d.nvrChannelNumber}`, PoE: `${poeSwitchName(d.poeSwitchId)}:${d.poePortNumber}`, Zone: d.zone, Type: d.cameraType, Quality: `${d.quality}MP` };
                break;
            case 'nvr':
                details = { ...details, Storage: d.storageCapacity, Channels: d.channels };
                break;
            case 'poe':
                 details = { ...details, Ports: `${d.portCount}${d.uplinkPortCount ? ` (+${d.uplinkPortCount} uplink)` : ''}` };
                break;
            case 'tv':
                details = { ...details, Size: `${d.size}"`, NVR: nvrName(d.nvrId) };
                break;
        }
        return details;
    };
    
    const detailsObject = getDetails(device);
    let detailsHtml = '';
    for (const [key, value] of Object.entries(detailsObject)) {
        detailsHtml += `<div class="detail-item"><span class="detail-key">${key}</span>: ${value}</div>`;
    }

    return `
      <div class="header">
        <div class="title">${device.name}</div>
        <div class="location">${device.location}</div>
      </div>
      <div class="details-grid">
        ${detailsHtml}
      </div>
    `;
};



  const filterDevices = <T extends Device>(devices: T[], term: string, status: 'all' | DeviceStatus) => {
    return devices.filter(device => {
        const deviceStatus = ('status' in device && device.status) ? ('derivedStatus' in device && device.derivedStatus ? device.derivedStatus : device.status) : 'active';
        return (status === 'all' || deviceStatus === status) &&
        (device.name.toLowerCase().includes(term.toLowerCase()) ||
         device.location.toLowerCase().includes(term.toLowerCase()) ||
         ('ipAddress' in device && device.ipAddress?.includes(term)))
    }).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const filteredCameras = useMemo(() => filterDevices(cameras, searchTerm, statusFilter), [cameras, searchTerm, statusFilter]);
  const filteredNvrs = useMemo(() => filterDevices(nvrs, searchTerm, statusFilter), [nvrs, searchTerm, statusFilter]);
  const filteredPoeSwitches = useMemo(() => filterDevices(derivedPoeSwitches, searchTerm, statusFilter), [derivedPoeSwitches, searchTerm, statusFilter]);
  const filteredTvScreens = useMemo(() => filterDevices(tvScreens, searchTerm, statusFilter), [tvScreens, searchTerm, statusFilter]);


  const getStatusBadgeVariant = (status: DeviceStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  }

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'camera': return <Camera className="w-4 h-4 mr-2" />;
      case 'nvr': return <Server className="w-4 h-4 mr-2" />;
      case 'poe': return <SwitchIcon className="w-4 h-4 mr-2" />;
      case 'tv': return <Tv2 className="w-4 h-4 mr-2" />;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">CCTV Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button onClick={handlePrintAllStickers} variant="outline">
                <Printer /> Print All Stickers
              </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus /> Add Device <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => handleAddNew('camera')}>
                        <Camera />
                        <span>Add Camera</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddNew('nvr')}>
                        <Server />
                        <span>Add NVR</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddNew('poe')}>
                        <SwitchIcon />
                        <span>Add PoE Switch</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddNew('tv')}>
                        <Tv2 />
                        <span>Add TV Screen</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </header>
        
        <>
          <Card className="mb-8">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search all devices..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant={statusFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('all')}>All</Button>
                <Button variant={statusFilter === 'active' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('active')}>Active</Button>
                <Button variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('inactive')}>Inactive</Button>
                  <Button variant={statusFilter === 'error' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('error')}>Error</Button>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="cameras" className="w-full">
              <div className="flex justify-between items-center mb-4">
                  <TabsList>
                      <TabsTrigger value="cameras"><Camera className="mr-2"/>Cameras ({filteredCameras.length})</TabsTrigger>
                      <TabsTrigger value="nvrs"><Server className="mr-2"/>NVRs ({filteredNvrs.length})</TabsTrigger>
                      <TabsTrigger value="poe"><SwitchIcon className="mr-2"/>PoE Switches ({filteredPoeSwitches.length})</TabsTrigger>
                      <TabsTrigger value="tvs"><Tv2 className="mr-2"/>TV Screens ({filteredTvScreens.length})</TabsTrigger>
                      <TabsTrigger value="tree"><ListTree className="mr-2"/>Device Tree</TabsTrigger>
                  </TabsList>
              </div>

              <>
                <TabsContent value="cameras">
                    <DeviceTable<CameraType> data={filteredCameras} poeSwitches={poeSwitches} nvrs={nvrs} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'camera')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} onShowConnection={setConnectionCamera} type="camera" />
                </TabsContent>
                <TabsContent value="nvrs">
                    <DeviceTable<NVR> data={filteredNvrs} poeSwitches={poeSwitches} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'nvr')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="nvr" />
                </TabsContent>
                <TabsContent value="poe">
                    <DeviceTable<POESwitch & { derivedStatus?: DeviceStatus }> data={filteredPoeSwitches} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'poe')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="poe" />
                </TabsContent>
                  <TabsContent value="tvs">
                    <DeviceTable<TVScreen> data={filteredTvScreens} nvrs={nvrs} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'tv')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="tv" />
                </TabsContent>
                 <TabsContent value="tree">
                    <DeviceTree 
                        devices={allDevices} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onPing={(item) => handlePing(item, false)}
                        onPrintSticker={setStickerDevice}
                        pinging={pinging}
                        getStatusBadgeVariant={getStatusBadgeVariant}
                        getDeviceIcon={getDeviceIcon}
                        poeSwitchMap={poeSwitchMap}
                    />
                </TabsContent>
              </>
          </Tabs>
        </>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          {isClient && formDeviceType && (
            <DeviceForm
              deviceType={formDeviceType}
              editingDevice={editingDevice}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              nvrs={nvrs}
              poeSwitches={poeSwitches}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!stickerDevice} onOpenChange={(open) => !open && setStickerDevice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Device Sticker</DialogTitle>
          </DialogHeader>
          {stickerDevice && (
            <>
                <div ref={stickerRef} className="sticker-container">
                    <div className="sticker" dangerouslySetInnerHTML={{ __html: renderDeviceSticker(stickerDevice) }}>
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handlePrintSticker}><Printer className="mr-2"/>Print</Button>
                </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!connectionCamera} onOpenChange={(open) => !open && setConnectionCamera(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Connection Path for {connectionCamera?.name}</DialogTitle>
              </DialogHeader>
              {connectionCamera && (
                <div className="flex items-center justify-center space-x-2 py-8">
                    <div className="flex flex-col items-center text-center">
                        <Camera className="w-8 h-8"/>
                        <p className="font-semibold">{connectionCamera.name}</p>
                        <p className="text-sm text-muted-foreground">{connectionCamera.ipAddress}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 shrink-0"/>
                    <div className="flex flex-col items-center text-center">
                        <SwitchIcon className="w-8 h-8"/>
                        <p className="font-semibold">{poeSwitchMap[connectionCamera.poeSwitchId]?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Port: {connectionCamera.poePortNumber}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 shrink-0"/>
                     <div className="flex flex-col items-center text-center">
                        <Server className="w-8 h-8"/>
                        <p className="font-semibold">{nvrMap[connectionCamera.nvrId]?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Channel: {connectionCamera.nvrChannelNumber}</p>
                    </div>
                </div>
              )}
          </DialogContent>
      </Dialog>

    </div>
  );
}


interface DeviceTableProps<T extends Device & { derivedStatus?: DeviceStatus }> {
    data: T[];
    poeSwitches?: POESwitch[];
    nvrs?: NVR[];
    onEdit?: (item: T) => void;
    onDelete?: (id: string, type: DeviceType) => void;
    onStatusChange: (item: T, newStatus: boolean) => void;
    onPing: (item: T) => void;
    onPrintSticker: (item: T) => void;
    onShowConnection?: (item: T) => void;
    pinging: Record<string, boolean>;
    getStatusBadgeVariant: (status: DeviceStatus) => string;
    type: DeviceType;
}

function DeviceTable<T extends Device & { derivedStatus?: DeviceStatus }>({ data, poeSwitches, nvrs, onEdit, onDelete, onStatusChange, onPing, onPrintSticker, onShowConnection, pinging, getStatusBadgeVariant, type }: DeviceTableProps<T>) {

    const poeSwitchMap = useMemo(() => {
        if (!poeSwitches) return {};
        return poeSwitches.reduce((acc, sw) => {
            acc[sw.id] = sw.name;
            return acc;
        }, {} as Record<string, string>);
    }, [poeSwitches]);

    const nvrMap = useMemo(() => {
        if (!nvrs) return {};
        return nvrs.reduce((acc, nvr) => {
            acc[nvr.id] = nvr.name;
            return acc;
        }, {} as Record<string, string>);
    }, [nvrs]);

    return (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {type !== 'tv' && <TableHead>Status</TableHead>}
                    <TableHead>Name</TableHead>
                    {type !== 'poe' && type !== 'tv' && 'ipAddress' in (data[0] || {}) && <TableHead>IP Address</TableHead>}
                    <TableHead>Location</TableHead>
                    {type === 'camera' && <TableHead>Type</TableHead>}
                    {type === 'camera' && <TableHead>Quality</TableHead>}
                    {type === 'camera' && <TableHead>Zone</TableHead>}
                    {type === 'camera' && <TableHead>PoE Port</TableHead>}
                    {type === 'camera' && <TableHead>NVR Channel</TableHead>}
                    {type === 'nvr' && <TableHead>Storage</TableHead>}
                    {type === 'nvr' && <TableHead>Channels</TableHead>}
                    {type === 'nvr' && <TableHead>Switch Port</TableHead>}
                    {type === 'poe' && <TableHead>Ports</TableHead>}
                    {type === 'tv' && <TableHead>Size</TableHead>}
                    {type === 'tv' && <TableHead>Associated NVR</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => {
                      const itemStatus = item.derivedStatus || ('status' in item ? item.status : 'active');
                      return (
                      <TableRow key={item.id}>
                        { itemStatus && item.type !== 'tv' && (
                          <TableCell>
                            <Badge variant="outline" className={cn('capitalize', getStatusBadgeVariant(itemStatus))}>
                              {itemStatus}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{item.name}</TableCell>
                        
                        {type !== 'poe' && type !== 'tv' && 'ipAddress' in item && (
                            <TableCell>{item.ipAddress || 'N/A'}</TableCell>
                        )}
                        
                        <TableCell>{item.location}</TableCell>
                        
                        {item.type === 'camera' && <TableCell className="capitalize">{(item as CameraType).cameraType}</TableCell>}
                        {item.type === 'camera' && <TableCell>{(item as CameraType).quality}MP</TableCell>}
                        {item.type === 'camera' && <TableCell>{(item as CameraType).zone}</TableCell>}
                        {item.type === 'camera' && <TableCell>{poeSwitchMap[(item as CameraType).poeSwitchId]}:{(item as CameraType).poePortNumber}</TableCell>}
                        {item.type === 'camera' && <TableCell>{nvrMap[(item as CameraType).nvrId]}:{(item as CameraType).nvrChannelNumber}</TableCell>}

                        {item.type === 'nvr' && <TableCell>{(item as NVR).storageCapacity}</TableCell>}
                        {item.type === 'nvr' && <TableCell>{(item as NVR).channels}</TableCell>}
                        {item.type === 'nvr' && <TableCell>{(item as NVR).switchId ? `${poeSwitchMap[(item as NVR).switchId!]}:${(item as NVR).switchPortNumber}` : 'N/A'}</TableCell>}

                        {item.type === 'poe' && <TableCell>{(item as POESwitch).portCount} {((item as POESwitch).uplinkPortCount ?? 0) > 0 ? `(+${(item as POESwitch).uplinkPortCount} uplink)` : ''}</TableCell>}

                        {item.type === 'tv' && <TableCell>{(item as TVScreen).size}"</TableCell>}
                        {item.type === 'tv' && <TableCell>{nvrMap[(item as TVScreen).nvrId]}</TableCell>}

                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                             { 'status' in item && item.type !== 'tv' && (
                              <Switch
                                  checked={item.status === 'active'}
                                  onCheckedChange={(checked) => onStatusChange(item, checked)}
                                  aria-label={`Toggle status for ${item.name}`}
                                  disabled={item.type === 'poe'}
                                />
                             )}
                            { 'status' in item && item.type !== 'tv' && (
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => onPing(item)} disabled={pinging[item.id] || !('ipAddress' in item && item.ipAddress)}>
                                              {pinging[item.id] ? <Loader2 className="animate-spin" /> : itemStatus === 'error' ? <WifiOff/> : <Wifi/>}
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          {'ipAddress' in item && item.ipAddress ? <p>Ping {item.name}</p> : <p>No IP to ping</p>}
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(item)}>
                                      <Pencil /> Edit
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onPrintSticker(item)}>
                                    <QrCode /> Print Sticker
                                </DropdownMenuItem>
                                {onShowConnection && item.type === 'camera' && (
                                    <DropdownMenuItem onClick={() => onShowConnection(item)}>
                                        <Share2 /> Show Connection
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                          <Trash2/> Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete "{item.name}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDelete(item.id, item.type)}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center h-24">
                        No devices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    );
}

type TreeViewRoot = 'nvr' | 'location';

interface DeviceTreeProps {
    devices: Device[];
    onEdit: (device: Device) => void;
    onDelete: (id: string, type: DeviceType) => void;
    onStatusChange: (device: Device, newStatus: boolean) => void;
    onPing: (device: Device) => void;
    onPrintSticker: (device: Device) => void;
    pinging: Record<string, boolean>;
    getStatusBadgeVariant: (status: DeviceStatus) => string;
    getDeviceIcon: (type: DeviceType) => React.ReactNode;
    poeSwitchMap: Record<string, POESwitch>;
}

function DeviceTree({ devices, onEdit, onDelete, onStatusChange, onPing, onPrintSticker, pinging, getStatusBadgeVariant, getDeviceIcon, poeSwitchMap }: DeviceTreeProps) {
    const [treeView, setTreeView] = useState<TreeViewRoot>('nvr');

    const tree = useMemo(() => {
        if (treeView === 'location') {
            const locations = devices.reduce((acc, device) => {
                const loc = device.location || 'Unassigned';
                if (!acc[loc]) {
                    acc[loc] = [];
                }
                acc[loc].push(device);
                return acc;
            }, {} as Record<string, Device[]>);

            return Object.entries(locations)
                .map(([location, devices]) => ({
                    id: location,
                    name: location,
                    children: devices.sort((a,b) => a.name.localeCompare(b.name)),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }

        // NVR-based tree
        let nvrs = devices.filter(d => d.type === 'nvr') as NVR[];
        const poeSwitches = devices.filter(d => d.type === 'poe') as (POESwitch & { derivedStatus?: DeviceStatus })[];
        const cameras = devices.filter(d => d.type === 'camera') as CameraType[];
        const tvs = devices.filter(d => d.type === 'tv') as TVScreen[];

        const nvrTree = nvrs.map(nvr => {
            const nvrCameras = cameras.filter(c => c.nvrId === nvr.id);
            const nvrTvs = tvs.filter(t => t.nvrId === nvr.id);
            const poeSwitchIds = new Set(nvrCameras.map(c => c.poeSwitchId));
            

            const poeTree = Array.from(poeSwitchIds).map(poeId => {
                const poeSwitch = poeSwitches.find(p => p.id === poeId);
                if (!poeSwitch) return null;
                const connectedItems = nvrCameras
                    .filter(c => c.poeSwitchId === poeId)
                    .concat(nvrs.filter(n => n.id !== nvr.id && n.switchId === poeId) as any);
                
                return {
                    ...poeSwitch,
                    children: connectedItems.sort((a, b) => a.name.localeCompare(b.name))
                };
            }).filter(Boolean) as (POESwitch & { children: (CameraType | NVR)[] })[];

            const camerasOnPoE = new Set(poeTree.flatMap(p => p.children.filter(c => c.type === 'camera')).map(c => c.id));
            const otherNvrChildren = [
                ...nvrCameras.filter(c => !camerasOnPoE.has(c.id)),
                ...nvrTvs
            ].sort((a, b) => a.name.localeCompare(b.name));

            return {
                ...nvr,
                poeTree,
                otherChildren: otherNvrChildren
            };
        });

        const assignedDeviceIds = new Set(
            devices.filter(d =>
                ((d.type === 'camera' || d.type === 'tv') && 'nvrId' in d && d.nvrId) ||
                (d.type === 'nvr' && 'switchId' in d && d.switchId)
            ).map(d => d.id)
        );
        
        const assignedPoeSwitchIds = new Set(
            nvrTree.flatMap(n => n.poeTree).map(p => p.id)
        );

        const unassigned = devices.filter(d => 
            !assignedDeviceIds.has(d.id) &&
            (d.type !== 'poe' || !assignedPoeSwitchIds.has(d.id)) &&
            d.type !== 'nvr'
        ).sort((a, b) => a.name.localeCompare(b.name));
        
        return { nvrTree, unassigned };

    }, [devices, treeView]);

    const renderDeviceItem = (item: Device) => {
        const itemStatus = 'derivedStatus' in item && item.derivedStatus ? item.derivedStatus : ('status' in item ? item.status : 'active');
        const poeSwitch = (item.type === 'nvr' && item.switchId) ? poeSwitchMap[item.switchId] : null;

        return (
            <div key={item.id} className="flex items-center justify-between p-2 ml-8 bg-card rounded-md border">
                <div className="flex items-center">
                    {getDeviceIcon(item.type)}
                    <span className="font-medium mr-4">{item.name}</span>
                    { itemStatus && item.type !== 'tv' && (
                      <Badge variant="outline" className={cn('capitalize text-xs', getStatusBadgeVariant(itemStatus))}>
                          {itemStatus}
                      </Badge>
                    )}
                     {poeSwitch && item.type === 'nvr' && (
                        <p className="text-sm text-muted-foreground ml-4">
                            Connected to: {poeSwitch.name}:{item.switchPortNumber}
                        </p>
                    )}
                </div>
                 <div className="flex items-center justify-end gap-2">
                    { 'status' in item && item.type !== 'tv' && (
                        <Switch
                            checked={item.status === 'active'}
                            onCheckedChange={(checked) => onStatusChange(item, checked)}
                            aria-label={`Toggle status for ${item.name}`}
                            disabled={item.type === 'poe'}
                            />
                    )}
                    { 'status' in item && item.type !== 'tv' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => onPing(item)} disabled={pinging[item.id] || !('ipAddress' in item && item.ipAddress)}>
                                        {pinging[item.id] ? <Loader2 className="animate-spin" /> : itemStatus === 'error' ? <WifiOff/> : <Wifi/>}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {'ipAddress' in item && item.ipAddress ? <p>Ping {item.name}</p> : <p>No IP to ping</p>}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPrintSticker(item)}>
                                <QrCode /> Print Sticker
                            </DropdownMenuItem>
                             <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        <Trash2/> Delete
                                    </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete "{item.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(item.id, item.type)}>
                                        Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Label htmlFor="tree-view-select">Group by</Label>
                    <Select value={treeView} onValueChange={(value) => setTreeView(value as TreeViewRoot)}>
                        <SelectTrigger id="tree-view-select" className="w-[180px]">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nvr">NVR</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
                 {treeView === 'nvr' && 'nvrTree' in tree && (
                    <>
                        <Accordion type="multiple" className="w-full">
                            {tree.nvrTree.map(nvr => (
                                <AccordionItem value={`nvr-${nvr.id}`} key={`nvr-${nvr.id}`}>
                                    <AccordionTrigger>
                                    <div className="flex items-center">
                                            {getDeviceIcon('nvr')}
                                            <span className="font-semibold text-lg">{nvr.name}</span>
                                    </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-2 pl-8">
                                        {nvr.poeTree.map(poeSwitch => (
                                            <Accordion type="multiple" key={poeSwitch.id} className="w-full">
                                                <AccordionItem value={`poe-${poeSwitch.id}`}>
                                                    <AccordionTrigger>
                                                        <div className="flex items-center">
                                                            {getDeviceIcon('poe')}
                                                            <span className="font-semibold">{poeSwitch.name}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="space-y-2">
                                                        {poeSwitch.children.map(renderDeviceItem)}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ))}
                                        {nvr.otherChildren.map(renderDeviceItem)}
                                        {nvr.poeTree.length === 0 && nvr.otherChildren.length === 0 && (
                                            <p className="ml-8 text-muted-foreground">No devices connected.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            
                            {tree.unassigned.length > 0 && (
                                <AccordionItem value="unassigned">
                                    <AccordionTrigger>
                                    <div className="flex items-center">
                                            <span className="font-semibold text-lg">Unassigned Devices</span>
                                    </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        {tree.unassigned.map(renderDeviceItem)}
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                        {tree.nvrTree.length === 0 && tree.unassigned.length === 0 && (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No devices found.</p>
                            </div>
                        )}
                    </>
                 )}
                 {treeView === 'location' && Array.isArray(tree) && (
                     <>
                        <Accordion type="multiple" className="w-full">
                           {tree.map(loc => (
                               <AccordionItem value={loc.id} key={loc.id}>
                                   <AccordionTrigger>
                                       <div className="flex items-center">
                                           <span className="font-semibold text-lg">{loc.name}</span>
                                       </div>
                                   </AccordionTrigger>
                                   <AccordionContent className="space-y-2">
                                       {loc.children.map(renderDeviceItem)}
                                   </AccordionContent>
                               </AccordionItem>
                           ))}
                        </Accordion>
                        {tree.length === 0 && (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No devices found.</p>
                            </div>
                        )}
                     </>
                 )}
            </CardContent>
        </Card>
    )
}
    

    