'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';

import {
  Camera,
  Plus,
  Search,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  X,
  Server,
  Network as SwitchIcon,
  Map,
  List,
  Wifi,
  WifiOff,
  Tv2,
  Printer,
  QrCode,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import type { Camera as CameraType, NVR, POESwitch, Device, DeviceStatus, TVScreen, DeviceType } from '@/types';
import { generateCameraReport } from '@/ai/flows/generate-camera-report';
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';


const baseDeviceSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  deviceType: z.enum(['camera', 'nvr', 'poe', 'tv']),
});

const deviceFormSchema = z.discriminatedUnion('deviceType', [
  baseDeviceSchema.extend({
    deviceType: z.literal('camera'),
    ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
    installationDate: z.date({ required_error: 'An installation date is required.' }),
    screenChannelNumber: z.coerce.number().int().min(1, { message: 'Channel number must be at least 1.' }),
    zone: z.string().min(1, { message: 'Zone is required.' }),
    poeSwitchId: z.string().min(1, { message: 'A PoE switch must be selected.' }),
    poePortNumber: z.coerce.number().int().min(1, { message: 'PoE port number must be at least 1.' }),
    cameraType: z.enum(['bullet', 'dome', 'ptz'], { required_error: 'Camera type is required.' }),
    quality: z.coerce.number().int().min(1, 'Quality must be at least 1MP.').max(15, 'Quality cannot exceed 15MP.'),
    nvrId: z.string().min(1, { message: 'An NVR must be selected.' }),
    nvrChannelNumber: z.coerce.number().int().min(1, { message: 'NVR channel number must be at least 1.' }),
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('nvr'),
    ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
    storageCapacity: z.string().min(1, { message: 'Storage capacity is required.' }),
    channels: z.coerce.number().int().min(1, { message: 'Channels must be at least 1.' }),
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('poe'),
    portCount: z.coerce.number().int().min(1, { message: 'Port count must be at least 1.' }),
    powerBudget: z.string().min(1, { message: 'Power budget is required.' }),
  }),
  baseDeviceSchema.extend({
    deviceType: z.literal('tv'),
    ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
    size: z.coerce.number().int().min(1, { message: 'Screen size must be positive.' }),
    nvrId: z.string().min(1, { message: 'An NVR must be selected.' }),
  }),
]);

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

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
  { id: 'poe1', type: 'poe', name: 'Lobby Switch', location: '1st Floor IT Closet', status: 'active', portCount: 8, powerBudget: '120W' },
  { id: 'poe2', type: 'poe', name: 'Office Switch', location: '2nd Floor IT Closet', status: 'active', portCount: 16, powerBudget: '250W' },
];

const initialTVScreens: TVScreen[] = [
    { id: 'tv1', type: 'tv', name: 'Lobby TV', ipAddress: '192.168.1.200', location: 'Main Lobby', status: 'active', size: 55, nvrId: 'nvr1' },
    { id: 'tv2', type: 'tv', name: 'Break Room TV', ipAddress: '192.168.2.201', location: 'Break Room', status: 'inactive', size: 65, nvrId: 'nvr2' },
];

const locationCoordinates: Record<string, { top: string; left: string }> = {
  "Main Lobby": { top: "30%", left: "25%" },
  "Exterior Parking": { top: "75%", left: "15%" },
  "Second Floor, Office 204": { top: "35%", left: "60%" },
  "Rooftop": { top: "10%", left: "75%" },
  "Server Room": { top: "50%", left: "50%" },
  "1st Floor IT Closet": { top: "60%", left: "40%" },
  "2nd Floor IT Closet": { top: "40%", left: "70%" },
  "Break Room": { top: "55%", left: "80%" },
  "Warehouse": { top: "85%", left: "50%" },
};


export default function Home() {
  const [cameras, setCameras] = useState<CameraType[]>(initialCameras);
  const [nvrs, setNvrs] = useState<NVR[]>(initialNVRs);
  const [poeSwitches, setPoeSwitches] = useState<POESwitch[]>(initialPOESwitches);
  const [tvScreens, setTvScreens] = useState<TVScreen[]>(initialTVScreens);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [stickerDevice, setStickerDevice] = useState<Device | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string>('https://picsum.photos/seed/map/1200/675');
  const [zoomLevel, setZoomLevel] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const stickerRef = useRef<HTMLDivElement>(null);
  const mapUploadInputRef = useRef<HTMLInputElement>(null);

  const allDevices: Device[] = useMemo(() => [...cameras, ...nvrs, ...poeSwitches, ...tvScreens], [cameras, nvrs, poeSwitches, tvScreens]);

  const poeSwitchMap = useMemo(() => poeSwitches.reduce((acc, sw) => ({ ...acc, [sw.id]: sw.name }), {} as Record<string, string>), [poeSwitches]);
  const nvrMap = useMemo(() => nvrs.reduce((acc, nvr) => ({ ...acc, [nvr.id]: nvr.name }), {} as Record<string, string>), [nvrs]);

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      deviceType: 'camera',
      name: '',
      location: '',
    }
  });
  
  const deviceType = form.watch('deviceType');

  useEffect(() => {
    if (editingDevice) {
      form.reset(editingDevice as any); // Type assertion is tricky with discriminated union
    } else {
       const defaultValues: Partial<DeviceFormValues> = {
        name: '',
        location: '',
      };
      // Reset with specific fields for the selected type to avoid lingering values
      switch (deviceType) {
        case 'camera':
          form.reset({ ...defaultValues, deviceType, ipAddress: '', installationDate: new Date(), screenChannelNumber: 1, zone: '', poeSwitchId: '', poePortNumber: 1, cameraType: 'dome', quality: 4, nvrId: '', nvrChannelNumber: 1 });
          break;
        case 'nvr':
           form.reset({ ...defaultValues, deviceType, ipAddress: '', storageCapacity: '', channels: 16 });
          break;
        case 'poe':
           form.reset({ ...defaultValues, deviceType, portCount: 8, powerBudget: '' });
          break;
        case 'tv':
            form.reset({ ...defaultValues, deviceType, ipAddress: '', size: 55, nvrId: '' });
            break;
        default:
             form.reset({deviceType: 'camera', name: '', location: ''});
      }
    }
  }, [editingDevice, form, deviceType]);
  

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
            if (device.status === 'error') {
                handlePing(device, true);
            }
        });
    }, 10000); // Ping error devices every 10 seconds

    return () => clearInterval(pingInterval);
  }, [allDevices, handlePing]);


  const handleFormSubmit = (values: DeviceFormValues) => {
    if (editingDevice) {
      updateDeviceById(editingDevice.id, values);
      toast({ title: 'Device Updated', description: `Successfully updated ${values.name}.` });
    } else {
      const newDevice = {
        id: crypto.randomUUID(),
        status: 'active' as DeviceStatus,
        ...values
      };

      switch(newDevice.deviceType) {
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
      toast({ title: 'Device Added', description: `Successfully added ${values.name}.` });
    }
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

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

  const handleGenerateReport = useCallback(async () => {
    setIsGeneratingReport(true);
    setReportDialogOpen(true);
    setReportContent('');
    try {
      const result = await generateCameraReport({
        cameraData: JSON.stringify(cameras),
      });
      setReportContent(result.report);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportContent('An error occurred while generating the report. Please try again.');
      toast({
        title: 'Report Generation Failed',
        description: 'Could not generate the camera report.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [cameras, toast]);

  const handlePrintSticker = () => {
    const printWindow = window.open('', '', 'height=400,width=600');
    if (printWindow && stickerRef.current) {
        printWindow.document.write('<html><head><title>Print Sticker</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } @page { size: 3.5in 2in; margin: 0; } } body { margin: 0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100%; } .sticker { width: 336px; height: 192px; box-sizing: border-box; border: 1px solid #000; padding: 0; display: flex; flex-direction: column; background: white; color: black; font-size: 14px; } .header { text-align: center; padding: 4px; border-bottom: 1px solid #000; } .title { font-weight: bold; font-size: 1.5rem; } .location { font-size: 0.9rem; } .details-table { width: 100%; border-collapse: collapse; } .details-table td { border: 1px solid #000; padding: 4px 8px; font-size: 0.9rem; } .details-table td:first-child { border-left: 0; } .details-table td:last-child { border-right: 0; } .details-table tr:last-child td { border-bottom: 0; } .detail-key { font-weight: bold; } </style>');
        printWindow.document.write('</head><body style="margin: 0; font-family: sans-serif;">');
        printWindow.document.write(stickerRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
    }
  };

  const handlePrintAllStickers = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>All Device Stickers</title>');
      printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } } body { font-family: sans-serif; } .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(336px, 1fr)); gap: 0.5rem; } .sticker { width: 336px; height: 192px; box-sizing: border-box; border: 1px solid #000; padding: 0; display: flex; flex-direction: column; page-break-inside: avoid; background: white; color: black; font-size: 14px; } .header { text-align: center; padding: 4px; border-bottom: 1px solid #000; } .title { font-weight: bold; font-size: 1.5rem; } .location { font-size: 0.9rem; } .details-table { width: 100%; border-collapse: collapse; } .details-table td { border: 1px solid #000; padding: 4px 8px; font-size: 0.9rem; } .details-table td:first-child { border-left: 0; } .details-table td:last-child { border-right: 0; } .details-table tr:last-child td { border-bottom: 0; } .detail-key { font-weight: bold; } </style>');
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
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 500);
    }
  };

  const handleMapImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMapImageUrl(e.target?.result as string);
        toast({ title: 'Map updated successfully!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderDeviceSticker = (device: Device | null): string => {
    if (!device) return '';

    const getDetails = (d: Device) => {
        let details: Record<string, any> = { ID: d.id.substring(0, 8).toUpperCase() };
        if ('ipAddress' in d && d.ipAddress) details['IP'] = d.ipAddress;

        switch (d.type) {
            case 'camera':
                details = { ...details, NVR: `${nvrMap[d.nvrId]}:${d.nvrChannelNumber}`, PoE: `${poeSwitchMap[d.poeSwitchId]}:${d.poePortNumber}`, Zone: d.zone, Type: d.cameraType, Quality: `${d.quality}MP` };
                break;
            case 'nvr':
                details = { ...details, Storage: d.storageCapacity, Channels: d.channels };
                break;
            case 'poe':
                details = { ...details, Ports: d.portCount, Budget: d.powerBudget };
                break;
            case 'tv':
                details = { ...details, Size: `${d.size}"`, NVR: nvrMap[d.nvrId] };
                break;
        }
        return details;
    };
    
    const detailsObject = getDetails(device);
    const detailsEntries = Object.entries(detailsObject);
    let tableRows = '';
    for (let i = 0; i < detailsEntries.length; i += 2) {
        const entry1 = detailsEntries[i];
        const entry2 = detailsEntries[i + 1];
        tableRows += `
            <tr>
                <td><span class="detail-key">${entry1[0]}</span> : ${entry1[1]}</td>
                ${entry2 ? `<td><span class="detail-key">${entry2[0]}</span> : ${entry2[1]}</td>` : '<td></td>'}
            </tr>
        `;
    }


    return `
      <div class="header">
        <div class="title">${device.name}</div>
        <div class="location">${device.location}</div>
      </div>
      <table class="details-table">
        <tbody>
            ${tableRows}
        </tbody>
      </table>
    `;
};



  const filterDevices = <T extends Device>(devices: T[], term: string, status: 'all' | DeviceStatus) => {
    return devices.filter(device => 
        (status === 'all' || device.status === status) &&
        (device.name.toLowerCase().includes(term.toLowerCase()) ||
         device.location.toLowerCase().includes(term.toLowerCase()) ||
         ('ipAddress' in device && device.ipAddress?.includes(term)))
    ).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const filteredCameras = useMemo(() => filterDevices(cameras, searchTerm, statusFilter), [cameras, searchTerm, statusFilter]);
  const filteredNvrs = useMemo(() => filterDevices(nvrs, searchTerm, statusFilter), [nvrs, searchTerm, statusFilter]);
  const filteredPoeSwitches = useMemo(() => filterDevices(poeSwitches, searchTerm, statusFilter), [poeSwitches, searchTerm, statusFilter]);
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
  
  const getDeviceIcon = (device: Device) => {
    switch (device.type) {
        case 'camera': return <Camera className="w-5 h-5" />;
        case 'nvr': return <Server className="w-5 h-5" />;
        case 'poe': return <SwitchIcon className="w-5 h-5" />;
        case 'tv': return <Tv2 className="w-5 h-5" />;
        default: return null;
    }
  };
  
  const getPinColor = (status: DeviceStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">CCTV Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrintAllStickers} variant="outline">
              <Printer /> Print All Stickers
            </Button>
            <Button onClick={handleGenerateReport} variant="outline">
              <FileText /> Generate Report
            </Button>
            <Button onClick={() => { setEditingDevice(null); form.reset({deviceType: 'camera', name: '', location: ''}); setIsFormOpen(true); }}>
              <Plus /> Add Device
            </Button>
          </div>
        </header>
        
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
                </TabsList>
                 <div className="flex items-center gap-2">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List /></Button>
                    <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('map')}><Map /></Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <>
                <TabsContent value="cameras">
                    <DeviceTable<CameraType> data={filteredCameras} poeSwitches={poeSwitches} nvrs={nvrs} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'camera')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="camera" />
                </TabsContent>
                <TabsContent value="nvrs">
                    <DeviceTable<NVR> data={filteredNvrs} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'nvr')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="nvr" />
                </TabsContent>
                <TabsContent value="poe">
                    <DeviceTable<POESwitch> data={filteredPoeSwitches} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'poe')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="poe" />
                </TabsContent>
                 <TabsContent value="tvs">
                    <DeviceTable<TVScreen> data={filteredTvScreens} nvrs={nvrs} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'tv')} onStatusChange={handleStatusChange} onPing={(item) => handlePing(item, false)} onPrintSticker={setStickerDevice} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="tv" />
                </TabsContent>
                </>
            ) : (
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>Device Map</CardTitle>
                      <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={mapUploadInputRef}
                            onChange={handleMapImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button variant="outline" onClick={() => mapUploadInputRef.current?.click()}>
                              <Upload /> Upload Map
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 3))}><ZoomIn /></Button>
                          <Slider
                            value={[zoomLevel]}
                            onValueChange={(value) => setZoomLevel(value[0])}
                            min={0.5}
                            max={3}
                            step={0.1}
                            className="w-32"
                          />
                          <Button variant="outline" size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}><ZoomOut /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div ref={mapContainerRef} className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-auto border">
                                <div className="relative w-full h-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
                                    <img src={mapImageUrl} alt="Office Map" className="w-full h-full object-contain" data-ai-hint="office floor plan" />
                                    {allDevices.map(device => {
                                        const coords = locationCoordinates[device.location];
                                        if (!coords) return null;
                                        return (
                                            <Tooltip key={device.id} delayDuration={100}>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ top: coords.top, left: coords.left }}>
                                                        <div className="relative flex items-center justify-center">
                                                            <div className={cn("w-4 h-4 rounded-full", getPinColor(device.status))}></div>
                                                            <div className={cn("absolute w-4 h-4 rounded-full animate-ping", getPinColor(device.status), {'hidden': pinging[device.id] || device.status !== 'error' })}></div>
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="flex items-center gap-2">
                                                        {getDeviceIcon(device)}
                                                        <div>
                                                            <p className="font-bold">{device.name}</p>
                                                            {'ipAddress' in device && device.ipAddress && <p className="text-sm text-muted-foreground">{device.ipAddress}</p>}
                                                            <p className="text-sm capitalize">Status: {device.status}</p>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            )}
        </Tabs>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
            <DialogDescription>
              {editingDevice
                ? 'Update the details for this device.'
                : 'Select a device type and enter its details.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
               <FormField
                control={form.control}
                name="deviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingDevice}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a device type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="camera">Camera</SelectItem>
                        <SelectItem value="nvr">NVR</SelectItem>
                        <SelectItem value="poe">PoE Switch</SelectItem>
                        <SelectItem value="tv">TV Screen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lobby Entrance Cam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              { (deviceType === 'camera' || deviceType === 'nvr' || deviceType === 'tv') && 'ipAddress' in form.getValues() && (
                <FormField
                    control={form.control}
                    name="ipAddress"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>IP Address</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 192.168.1.100" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Building, 1st Floor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {deviceType === 'camera' && (
                <>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cameraType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Camera Type</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="bullet">Bullet</SelectItem>
                                    <SelectItem value="dome">Dome</SelectItem>
                                    <SelectItem value="ptz">PTZ</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="quality"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quality (MP)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 4" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="zone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Zone</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., A" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="screenChannelNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Screen Channel</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="poeSwitchId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>PoE Switch</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a switch" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {poeSwitches.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="poePortNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>PoE Port</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 5" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nvrId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>NVR</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select an NVR" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {nvrs.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="nvrChannelNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>NVR Channel</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 3" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Installation Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1990-01-01')}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </>
              )}
              
               {deviceType === 'nvr' && (
                <>
                  <FormField
                    control={form.control}
                    name="storageCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Capacity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 16TB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="channels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channels</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 16" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {deviceType === 'poe' && (
                 <>
                  <FormField
                    control={form.control}
                    name="portCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port Count</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="powerBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power Budget</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 120W" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {deviceType === 'tv' && (
                <>
                  <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Screen Size (inches)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 55" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="nvrId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Associated NVR</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                  <SelectValue placeholder="Select an NVR" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {nvrs.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </>
              )}
              
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">Save Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>AI-Generated Camera Report</DialogTitle>
              <DialogDescription>
                Analysis of camera inventory, highlighting potential issues.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[50vh] my-4">
              {isGeneratingReport ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating report, please wait...</p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted/50">
                  <pre className="whitespace-pre-wrap font-body text-sm">{reportContent}</pre>
                </div>
              )}
            </ScrollArea>
             <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
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
    </div>
  );
}


interface DeviceTableProps<T extends Device> {
    data: T[];
    poeSwitches?: POESwitch[];
    nvrs?: NVR[];
    onEdit?: (item: T) => void;
    onDelete?: (id: string) => void;
    onStatusChange: (item: T, newStatus: boolean) => void;
    onPing: (item: T) => void;
    onPrintSticker: (item: T) => void;
    pinging: Record<string, boolean>;
    getStatusBadgeVariant: (status: DeviceStatus) => string;
    type: DeviceType;
}

function DeviceTable<T extends Device>({ data, poeSwitches, nvrs, onEdit, onDelete, onStatusChange, onPing, onPrintSticker, pinging, getStatusBadgeVariant, type }: DeviceTableProps<T>) {

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
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    {type !== 'poe' && <TableHead>IP Address</TableHead>}
                    <TableHead>Location</TableHead>
                    {type === 'camera' && <TableHead>Type</TableHead>}
                    {type === 'camera' && <TableHead>Quality</TableHead>}
                    {type === 'camera' && <TableHead>Zone</TableHead>}
                    {type === 'camera' && <TableHead>PoE Port</TableHead>}
                    {type === 'camera' && <TableHead>NVR Channel</TableHead>}
                    {type === 'nvr' && <TableHead>Storage</TableHead>}
                    {type === 'nvr' && <TableHead>Channels</TableHead>}
                    {type === 'poe' && <TableHead>Ports</TableHead>}
                    {type === 'poe' && <TableHead>Power Budget</TableHead>}
                    {type === 'tv' && <TableHead>Size</TableHead>}
                    {type === 'tv' && <TableHead>Associated NVR</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className={cn('capitalize', getStatusBadgeVariant(item.status))}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        
                        {type !== 'poe' && 'ipAddress' in item && (
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

                        {item.type === 'poe' && <TableCell>{(item as POESwitch).portCount}</TableCell>}
                        {item.type === 'poe' && <TableCell>{(item as POESwitch).powerBudget}</TableCell>}

                        {item.type === 'tv' && <TableCell>{(item as TVScreen).size}"</TableCell>}
                        {item.type === 'tv' && <TableCell>{nvrMap[(item as TVScreen).nvrId]}</TableCell>}

                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Switch
                                checked={item.status === 'active'}
                                onCheckedChange={(checked) => onStatusChange(item, checked)}
                                aria-label={`Toggle status for ${item.name}`}
                              />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => onPing(item)} disabled={pinging[item.id] || !('ipAddress' in item && item.ipAddress)}>
                                            {pinging[item.id] ? <Loader2 className="animate-spin" /> : item.status === 'error' ? <WifiOff/> : <Wifi/>}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {'ipAddress' in item && item.ipAddress ? <p>Ping {item.name}</p> : <p>No IP to ping</p>}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

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
                                          <AlertDialogAction onClick={() => onDelete(item.id)}>
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
                    ))
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

    