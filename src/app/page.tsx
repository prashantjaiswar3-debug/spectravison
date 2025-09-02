'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

import type { Camera as CameraType, NVR, POESwitch, Device, DeviceStatus } from '@/types';
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
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const cameraFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  installationDate: z.date({
    required_error: 'An installation date is required.',
  }),
});

const initialCameras: CameraType[] = [
  {
    id: 'a1b2c3d4',
    name: 'Lobby Cam 1',
    ipAddress: '192.168.1.101',
    location: 'Main Lobby',
    installationDate: new Date('2023-01-15'),
    status: 'active',
  },
  {
    id: 'e5f6g7h8',
    name: 'Parking Lot Cam',
    ipAddress: '192.168.1.102',
    location: 'Exterior Parking',
    installationDate: new Date('2022-11-20'),
    status: 'inactive',
  },
  {
    id: 'i9j0k1l2',
    name: 'Office Cam 204',
    ipAddress: '192.168.2.55',
    location: 'Second Floor, Office 204',
    installationDate: new Date('2023-05-10'),
    status: 'active',
  },
  {
    id: 'm3n4o5p6',
    name: 'Rooftop East',
    ipAddress: '192.168.1.108',
    location: 'Rooftop',
    installationDate: new Date('2021-08-01'),
    status: 'error',
  },
];

const initialNVRs: NVR[] = [
  { id: 'nvr1', name: 'Main NVR', ipAddress: '192.168.1.50', location: 'Server Room', status: 'active', storageCapacity: '16TB', channels: 16 },
  { id: 'nvr2', name: 'Backup NVR', ipAddress: '192.168.1.51', location: 'Server Room', status: 'inactive', storageCapacity: '8TB', channels: 8 },
];

const initialPOESwitches: POESwitch[] = [
  { id: 'poe1', name: 'Lobby Switch', location: '1st Floor IT Closet', status: 'active', portCount: 8, powerBudget: '120W' },
  { id: 'poe2', name: 'Office Switch', location: '2nd Floor IT Closet', status: 'active', portCount: 16, powerBudget: '250W' },
];

const locationCoordinates: Record<string, { top: string; left: string }> = {
  "Main Lobby": { top: "30%", left: "25%" },
  "Exterior Parking": { top: "75%", left: "15%" },
  "Second Floor, Office 204": { top: "35%", left: "60%" },
  "Rooftop": { top: "10%", left: "75%" },
  "Server Room": { top: "50%", left: "50%" },
  "1st Floor IT Closet": { top: "60%", left: "40%" },
  "2nd Floor IT Closet": { top: "40%", left: "70%" },
};


export default function Home() {
  const [cameras, setCameras] = useState<CameraType[]>(initialCameras);
  const [nvrs, setNvrs] = useState<NVR[]>(initialNVRs);
  const [poeSwitches, setPoeSwitches] = useState<POESwitch[]>(initialPOESwitches);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [pinging, setPinging] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const form = useForm<z.infer<typeof cameraFormSchema>>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      name: '',
      ipAddress: '',
      location: '',
      installationDate: undefined,
    }
  });

  useEffect(() => {
    if (editingCamera) {
      form.reset({
        name: editingCamera.name,
        ipAddress: editingCamera.ipAddress,
        location: editingCamera.location,
        installationDate: editingCamera.installationDate,
      });
    } else {
      form.reset({
        name: '',
        ipAddress: '',
        location: '',
        installationDate: undefined,
      });
    }
  }, [editingCamera, form]);

  const allDevices: Device[] = useMemo(() => [...cameras, ...nvrs, ...poeSwitches], [cameras, nvrs, poeSwitches]);

  const handlePing = (device: Device) => {
    if (!('ipAddress' in device)) {
        toast({
            title: `Ping ${device.name}`,
            description: `This device does not have an IP address to ping.`,
            variant: 'destructive',
        });
        return;
    }
    setPinging(prev => ({...prev, [device.id]: true}));
    
    // Simulate network delay
    setTimeout(() => {
        // Simulate a 10% chance of error
        const isError = Math.random() < 0.1;
        const newStatus = isError ? 'error' : 'active';

        const updateDevice = (setter: React.Dispatch<React.SetStateAction<any[]>>, id: string) => {
             setter(prev => prev.map(d => d.id === id ? {...d, status: newStatus} : d));
        };

        if ('installationDate' in device) { // is Camera
            updateDevice(setCameras, device.id);
        } else if ('storageCapacity' in device) { // is NVR
            updateDevice(setNvrs, device.id);
        } else { // is POESwitch
            updateDevice(setPoeSwitches, device.id);
        }
        
        setPinging(prev => ({...prev, [device.id]: false}));
        toast({
            title: `Ping ${device.name}`,
            description: `Device is ${newStatus}.`,
            variant: newStatus === 'error' ? 'destructive' : 'default',
        });
    }, 1000 + Math.random() * 1000);
  };

  const handleFormSubmit = (values: z.infer<typeof cameraFormSchema>) => {
    if (editingCamera) {
      setCameras(
        cameras.map((c) =>
          c.id === editingCamera.id ? { ...c, ...values, status: c.status } : c
        )
      );
      toast({ title: 'Camera Updated', description: `Successfully updated ${values.name}.` });
    } else {
      const newCamera: CameraType = {
        id: crypto.randomUUID(),
        status: 'active',
        ...values,
      };
      setCameras([...cameras, newCamera]);
      toast({ title: 'Camera Added', description: `Successfully added ${values.name}.` });
    }
    setIsFormOpen(false);
    setEditingCamera(null);
  };

  const handleEdit = (camera: CameraType) => {
    setEditingCamera(camera);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, type: 'camera' | 'nvr' | 'poe') => {
    if (type === 'camera') setCameras(cameras.filter((c) => c.id !== id));
    // Similarly for NVR and PoE Switch if needed
    toast({ title: 'Device Deleted', variant: 'destructive' });
  };

  const handleStatusChange = (device: Device, newStatus: boolean) => {
    const status = newStatus ? 'active' : 'inactive';
     const updateDevice = (setter: React.Dispatch<React.SetStateAction<any[]>>, id: string) => {
         setter(prev => prev.map(d => d.id === id ? {...d, status} : d));
    };

    if ('installationDate' in device) { // is Camera
        updateDevice(setCameras, device.id);
    } else if ('storageCapacity' in device) { // is NVR
        updateDevice(setNvrs, device.id);
    } else { // is POESwitch
        updateDevice(setPoeSwitches, device.id);
    }
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

  const filteredCameras = useMemo(() => {
    return cameras.filter(camera => 
        (statusFilter === 'all' || camera.status === statusFilter) &&
        (camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         camera.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
         camera.ipAddress.includes(searchTerm))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [cameras, searchTerm, statusFilter]);

  const filteredNvrs = useMemo(() => {
    return nvrs.filter(nvr => 
        (statusFilter === 'all' || nvr.status === statusFilter) &&
        (nvr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         nvr.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
         nvr.ipAddress.includes(searchTerm))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [nvrs, searchTerm, statusFilter]);

  const filteredPoeSwitches = useMemo(() => {
    return poeSwitches.filter(sw => 
        (statusFilter === 'all' || sw.status === statusFilter) &&
        (sw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         sw.location.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [poeSwitches, searchTerm, statusFilter]);


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
    if ('installationDate' in device) return <Camera className="w-5 h-5" />;
    if ('storageCapacity' in device) return <Server className="w-5 h-5" />;
    if ('portCount' in device) return <SwitchIcon className="w-5 h-5" />;
    return null;
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
            <Button onClick={handleGenerateReport} variant="outline">
              <FileText /> Generate Report
            </Button>
            <Button onClick={() => { setEditingCamera(null); setIsFormOpen(true); }}>
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
                </TabsList>
                 <div className="flex items-center gap-2">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List /></Button>
                    <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('map')}><Map /></Button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <>
                <TabsContent value="cameras">
                    <DeviceTable<CameraType> data={filteredCameras} onEdit={handleEdit} onDelete={(id) => handleDelete(id, 'camera')} onStatusChange={handleStatusChange} onPing={handlePing} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="camera" />
                </TabsContent>
                <TabsContent value="nvrs">
                    <DeviceTable<NVR> data={filteredNvrs} onStatusChange={handleStatusChange} onPing={handlePing} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="nvr" />
                </TabsContent>
                <TabsContent value="poe">
                    <DeviceTable<POESwitch> data={filteredPoeSwitches} onStatusChange={handleStatusChange} onPing={handlePing} pinging={pinging} getStatusBadgeVariant={getStatusBadgeVariant} type="poe" />
                </TabsContent>
                </>
            ) : (
                <Card>
                    <CardHeader><CardTitle>Device Map</CardTitle></CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden border">
                                <img src="https://picsum.photos/seed/map/1200/675" alt="Office Map" className="w-full h-full object-cover opacity-50" data-ai-hint="office floor plan" />
                                {allDevices.map(device => {
                                    const coords = locationCoordinates[device.location];
                                    if (!coords) return null;
                                    return (
                                        <Tooltip key={device.id} delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ top: coords.top, left: coords.left }}>
                                                    <div className="relative flex items-center justify-center">
                                                         <div className={cn("w-4 h-4 rounded-full", getPinColor(device.status))}></div>
                                                         <div className={cn("absolute w-4 h-4 rounded-full animate-ping", getPinColor(device.status), {'hidden': !pinging[device.id]})}></div>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="flex items-center gap-2">
                                                    {getDeviceIcon(device)}
                                                    <div>
                                                        <p className="font-bold">{device.name}</p>
                                                        {'ipAddress' in device && <p className="text-sm text-muted-foreground">{device.ipAddress}</p>}
                                                        <p className="text-sm capitalize">Status: {device.status}</p>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            )}
        </Tabs>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCamera ? 'Edit Camera' : 'Add New Camera'}</DialogTitle>
            <DialogDescription>
              {editingCamera
                ? 'Update the details for this camera. NVR and PoE Switch forms coming soon!'
                : 'Enter the details for the new camera. NVR and PoE Switch forms coming soon!'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lobby Entrance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">Save Camera</Button>
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
    </div>
  );
}


interface DeviceTableProps<T extends Device> {
    data: T[];
    onEdit?: (item: T) => void;
    onDelete?: (id: string) => void;
    onStatusChange: (item: T, newStatus: boolean) => void;
    onPing: (item: T) => void;
    pinging: Record<string, boolean>;
    getStatusBadgeVariant: (status: DeviceStatus) => string;
    type: 'camera' | 'nvr' | 'poe';
}

function DeviceTable<T extends Device>({ data, onEdit, onDelete, onStatusChange, onPing, pinging, getStatusBadgeVariant, type }: DeviceTableProps<T>) {
    
    const isCamera = (item: Device): item is CameraType => type === 'camera';
    const isNVR = (item: Device): item is NVR => type === 'nvr';
    const isPOESwitch = (item: Device): item is POESwitch => type === 'poe';

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
                    {type === 'camera' && <TableHead>Installed</TableHead>}
                    {type === 'nvr' && <TableHead>Storage</TableHead>}
                    {type === 'nvr' && <TableHead>Channels</TableHead>}
                    {type === 'poe' && <TableHead>Ports</TableHead>}
                    {type === 'poe' && <TableHead>Power Budget</TableHead>}
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
                        {type !== 'poe' && <TableCell>{(item as CameraType | NVR).ipAddress}</TableCell>}
                        <TableCell>{item.location}</TableCell>
                        
                        {isCamera(item) && <TableCell>{format((item as CameraType).installationDate, 'PPP')}</TableCell>}

                        {isNVR(item) && <TableCell>{item.storageCapacity}</TableCell>}
                        {isNVR(item) && <TableCell>{item.channels}</TableCell>}

                        {isPOESwitch(item) && <TableCell>{item.portCount}</TableCell>}
                        {isPOESwitch(item) && <TableCell>{item.powerBudget}</TableCell>}
                        
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
                                        <Button variant="ghost" size="icon" onClick={() => onPing(item)} disabled={pinging[item.id] || !('ipAddress' in item)}>
                                            {pinging[item.id] ? <Loader2 className="animate-spin" /> : item.status === 'error' ? <WifiOff/> : <Wifi/>}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {'ipAddress' in item ? <p>Ping {item.name}</p> : <p>No IP to ping</p>}
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
                                {onEdit && isCamera(item) && (
                                    <DropdownMenuItem onClick={() => onEdit(item)}>
                                      <Pencil /> Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
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
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
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
