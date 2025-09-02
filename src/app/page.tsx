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
} from 'lucide-react';

import type { Camera as CameraType } from '@/types';
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

const cameraFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IPv4 address.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  firmwareVersion: z.string().min(1, { message: 'Firmware version is required.' }),
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
    firmwareVersion: 'v1.2.3',
  },
  {
    id: 'e5f6g7h8',
    name: 'Parking Lot Cam',
    ipAddress: '192.168.1.102',
    location: 'Exterior Parking',
    installationDate: new Date('2022-11-20'),
    status: 'inactive',
    firmwareVersion: 'v1.1.0',
  },
  {
    id: 'i9j0k1l2',
    name: 'Office Cam 204',
    ipAddress: '192.168.2.55',
    location: 'Second Floor, Office 204',
    installationDate: new Date('2023-05-10'),
    status: 'active',
    firmwareVersion: 'v1.3.0',
  },
  {
    id: 'm3n4o5p6',
    name: 'Rooftop East',
    ipAddress: '192.168.1.108',
    location: 'Rooftop',
    installationDate: new Date('2021-08-01'),
    status: 'active',
    firmwareVersion: 'v1.0.5',
  },
];

export default function Home() {
  const [cameras, setCameras] = useState<CameraType[]>(initialCameras);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof cameraFormSchema>>({
    resolver: zodResolver(cameraFormSchema),
  });

  useEffect(() => {
    if (editingCamera) {
      form.reset({
        name: editingCamera.name,
        ipAddress: editingCamera.ipAddress,
        location: editingCamera.location,
        firmwareVersion: editingCamera.firmwareVersion,
        installationDate: editingCamera.installationDate,
      });
    } else {
      form.reset({
        name: '',
        ipAddress: '',
        location: '',
        firmwareVersion: '',
        installationDate: undefined,
      });
    }
  }, [editingCamera, form]);

  const handleFormSubmit = (values: z.infer<typeof cameraFormSchema>) => {
    if (editingCamera) {
      setCameras(
        cameras.map((c) =>
          c.id === editingCamera.id ? { ...c, ...values } : c
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

  const handleDelete = (id: string) => {
    setCameras(cameras.filter((c) => c.id !== id));
    toast({ title: 'Camera Deleted', variant: 'destructive' });
  };

  const handleStatusChange = (camera: CameraType, newStatus: boolean) => {
    setCameras(
      cameras.map((c) =>
        c.id === camera.id
          ? { ...c, status: newStatus ? 'active' : 'inactive' }
          : c
      )
    );
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
    return cameras
      .filter((camera) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (camera.name.toLowerCase().includes(searchLower) ||
            camera.location.toLowerCase().includes(searchLower) ||
            camera.ipAddress.includes(searchTerm)) &&
          (statusFilter === 'all' || camera.status === statusFilter)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cameras, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">CCTV Manager</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </Button>
            <Button onClick={() => { setEditingCamera(null); setIsFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Camera
            </Button>
          </div>
        </header>

        <Card className="mb-8">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or IP..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'secondary' : 'ghost'}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Firmware</TableHead>
                    <TableHead className="hidden sm:table-cell">Installed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCameras.length > 0 ? (
                    filteredCameras.map((camera) => (
                      <TableRow key={camera.id}>
                        <TableCell>
                          <Badge variant={camera.status === 'active' ? 'default' : 'destructive'} className={cn(camera.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30', 'capitalize')}>
                            {camera.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{camera.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{camera.ipAddress}</TableCell>
                        <TableCell>{camera.location}</TableCell>
                        <TableCell className="hidden lg:table-cell">{camera.firmwareVersion}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(camera.installationDate, 'PPP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Switch
                                checked={camera.status === 'active'}
                                onCheckedChange={(checked) => handleStatusChange(camera, checked)}
                                aria-label={`Toggle status for ${camera.name}`}
                              />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEdit(camera)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                      <span className="text-destructive">Delete</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the camera "{camera.name}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(camera.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        No cameras found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCamera ? 'Edit Camera' : 'Add New Camera'}</DialogTitle>
            <DialogDescription>
              {editingCamera
                ? 'Update the details for this camera.'
                : 'Enter the details for the new camera.'}
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
                name="firmwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmware Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., v2.1.4" {...field} />
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
