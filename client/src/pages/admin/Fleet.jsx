import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Fuel, Wrench, Plus, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/tables/DataTable';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockVehicles = [
  { id: 1, plate: 'B 234 567', model: 'Isuzu NPR', status: 'Active', mileage: 45200, fuelLevel: 72, nextMaintenance: '2026-04-20' },
  { id: 2, plate: 'B 345 678', model: 'Mitsubishi Canter', status: 'Active', mileage: 32100, fuelLevel: 85, nextMaintenance: '2026-05-05' },
  { id: 3, plate: 'B 456 789', model: 'Isuzu NPR', status: 'Maintenance', mileage: 67800, fuelLevel: 30, nextMaintenance: '2026-04-10' },
  { id: 4, plate: 'B 567 890', model: 'Hino 300', status: 'Active', mileage: 28400, fuelLevel: 60, nextMaintenance: '2026-04-25' },
  { id: 5, plate: 'B 678 901', model: 'Toyota Dyna', status: 'Active', mileage: 51300, fuelLevel: 45, nextMaintenance: '2026-05-12' },
];

const generateFuelData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      liters: +(25 + Math.random() * 30).toFixed(1),
    });
  }
  return data;
};

const mockFuelComparison = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    day,
    'B 234 567': +(30 + Math.random() * 20).toFixed(0),
    'B 345 678': +(25 + Math.random() * 15).toFixed(0),
    'B 456 789': 0,
    'B 567 890': +(28 + Math.random() * 18).toFixed(0),
    'B 678 901': +(32 + Math.random() * 16).toFixed(0),
  }));
})();

const mockMaintenanceHistory = [
  { id: 1, vehicle: 'B 456 789', type: 'Engine Service', date: '2026-04-08', cost: 450, status: 'In Progress', mileage: 67800 },
  { id: 2, vehicle: 'B 234 567', type: 'Tire Replacement', date: '2026-03-28', cost: 320, status: 'Completed', mileage: 44800 },
  { id: 3, vehicle: 'B 345 678', type: 'Oil Change', date: '2026-03-15', cost: 85, status: 'Completed', mileage: 31500 },
  { id: 4, vehicle: 'B 567 890', type: 'Brake Inspection', date: '2026-03-10', cost: 120, status: 'Completed', mileage: 27900 },
  { id: 5, vehicle: 'B 678 901', type: 'Transmission Service', date: '2026-02-28', cost: 680, status: 'Completed', mileage: 50000 },
  { id: 6, vehicle: 'B 234 567', type: 'Oil Change', date: '2026-02-15', cost: 85, status: 'Completed', mileage: 43200 },
  { id: 7, vehicle: 'B 456 789', type: 'Brake Replacement', date: '2026-01-20', cost: 480, status: 'Completed', mileage: 65000 },
];

const mockRouteHistory = [
  { id: 1, date: '2026-04-08', route: 'R-14', stops: 4, distance: '42 km', duration: '2h 15m' },
  { id: 2, date: '2026-04-07', route: 'R-12', stops: 3, distance: '35 km', duration: '1h 50m' },
  { id: 3, date: '2026-04-06', route: 'R-16', stops: 5, distance: '58 km', duration: '3h 10m' },
  { id: 4, date: '2026-04-05', route: 'R-11', stops: 3, distance: '28 km', duration: '1h 30m' },
];

const maintenanceColumns = [
  { accessorKey: 'vehicle', header: 'Vehicle' },
  { accessorKey: 'type', header: 'Service Type' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.cost) },
  { accessorKey: 'mileage', header: 'Mileage', cell: ({ row }) => `${row.original.mileage.toLocaleString()} km` },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Completed' ? 'success' : 'warning'}>{row.original.status}</Badge>
    ),
  },
];

const routeColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'route', header: 'Route' },
  { accessorKey: 'stops', header: 'Stops' },
  { accessorKey: 'distance', header: 'Distance' },
  { accessorKey: 'duration', header: 'Duration' },
];

function Fleet() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [addVehicleDialog, setAddVehicleDialog] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: '', model: '', mileage: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicleId: '', type: '', cost: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: fleetData, refetch: refetchFleet } = useFetch('/fleet');
  const { data: statsData } = useFetch('/fleet/stats');
  const { data: vehicleDetail, refetch: refetchDetail } = useFetch(selectedVehicle ? `/fleet/${selectedVehicle.id}` : null);

  const vehicles = fleetData?.data
    ? fleetData.data.map((v) => ({
        id: v.id,
        plate: v.plateNumber,
        model: v.model,
        status: v.status === 'ACTIVE' ? 'Active' : v.status === 'MAINTENANCE' ? 'Maintenance' : v.status,
        mileage: v.mileage || 0,
        fuelLevel: v.fuelConsumption || 0,
        nextMaintenance: '',
        _count: v._count,
      }))
    : mockVehicles;

  const stats = statsData || {};
  const totalMileage = stats.avgMileage ? stats.avgMileage * (stats.totalVehicles || 1) : vehicles.reduce((s, v) => s + v.mileage, 0);
  const activeCount = stats.byStatus?.ACTIVE ?? vehicles.filter((v) => v.status === 'Active').length;
  const maintenanceCount = stats.byStatus?.MAINTENANCE ?? vehicles.filter((v) => v.status === 'Maintenance').length;

  const handleAddVehicle = async () => {
    if (!vehicleForm.plateNumber || !vehicleForm.model) {
      toast.error('Please fill in plate number and model');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/fleet', {
        plateNumber: vehicleForm.plateNumber,
        model: vehicleForm.model,
        mileage: Number(vehicleForm.mileage) || 0,
      });
      toast.success('Vehicle added successfully');
      setAddVehicleDialog(false);
      setVehicleForm({ plateNumber: '', model: '', mileage: '' });
      refetchFleet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogMaintenance = async () => {
    if (!maintenanceForm.vehicleId || !maintenanceForm.type) {
      toast.error('Please select a vehicle and service type');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/fleet/${maintenanceForm.vehicleId}/maintenance`, {
        type: maintenanceForm.type,
        description: maintenanceForm.description,
        cost: Number(maintenanceForm.cost) || 0,
        date: new Date().toISOString(),
      });
      toast.success('Maintenance record saved');
      setMaintenanceDialog(false);
      setMaintenanceForm({ vehicleId: '', type: '', cost: '', description: '' });
      refetchFleet();
      if (selectedVehicle) refetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const detailMaintenance = vehicleDetail?.maintenance
    ? vehicleDetail.maintenance.map((m) => ({
        id: m.id,
        vehicle: selectedVehicle?.plate || '',
        type: m.type,
        date: m.date ? m.date.split('T')[0] : '',
        cost: m.cost || 0,
        status: 'Completed',
        mileage: 0,
      }))
    : mockMaintenanceHistory.filter((m) => m.vehicle === selectedVehicle?.plate);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Fleet Management</h1>
          <p className="text-brand-secondary text-sm mt-1">Vehicle tracking, maintenance, and fuel consumption</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setMaintenanceDialog(true)}>
            <Wrench className="w-4 h-4 mr-2" /> Log Maintenance
          </Button>
          <Button onClick={() => setAddVehicleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Vehicles" value={stats.totalVehicles ?? vehicles.length} icon={Truck} />
        <KPICard title="Active" value={activeCount} icon={Activity} trend="up" trendValue={0} />
        <KPICard title="In Maintenance" value={maintenanceCount} icon={Wrench} />
        <KPICard title="Total Mileage (Month)" value={`${(totalMileage / 1000).toFixed(1)}k km`} icon={Fuel} trend="up" trendValue={5.2} />
      </motion.div>

      {/* Vehicle Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            className={`cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? 'border-brand-accent' : 'hover:border-brand-accent/50'}`}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Truck className="w-6 h-6 text-brand-accent" />
                <Badge variant={vehicle.status === 'Active' ? 'success' : 'warning'}>{vehicle.status}</Badge>
              </div>
              <p className="text-brand-primary font-bold text-lg">{vehicle.plate}</p>
              <p className="text-brand-muted text-sm">{vehicle.model}</p>
              <div className="mt-4 pt-3 border-t border-brand-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-secondary">Mileage</span>
                  <span className="text-brand-primary">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-secondary">Fuel Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-brand-base rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${vehicle.fuelLevel > 50 ? 'bg-brand-success' : vehicle.fuelLevel > 25 ? 'bg-brand-warning' : 'bg-brand-error'}`}
                        style={{ width: `${vehicle.fuelLevel}%` }}
                      />
                    </div>
                    <span className="text-brand-primary text-xs">{vehicle.fuelLevel}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-secondary">Next Service</span>
                  <span className="text-brand-primary">{vehicle.nextMaintenance}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Selected Vehicle Detail */}
      {selectedVehicle && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-brand-primary mb-4">
                {selectedVehicle.plate} - {selectedVehicle.model}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Fuel Consumption" subtitle="Last 30 days (liters)">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={generateFuelData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                      <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
                      <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                      <Line type="monotone" dataKey="liters" stroke="#4EECD3" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <div>
                  <h4 className="text-brand-primary font-semibold mb-3">Route History</h4>
                  <DataTable columns={routeColumns} data={mockRouteHistory} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-brand-primary font-semibold mb-3">Maintenance History</h4>
            <DataTable
              columns={maintenanceColumns}
              data={detailMaintenance}
              searchPlaceholder="Search maintenance..."
              searchColumn="type"
            />
          </div>
        </motion.div>
      )}

      {/* Fuel Comparison Chart */}
      <motion.div variants={fadeInUp}>
        <ChartCard title="Fuel Consumption Comparison" subtitle="All vehicles, last 7 days">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockFuelComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
              <XAxis dataKey="day" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8AABA6' }} />
              {mockVehicles.map((v, i) => (
                <Bar key={v.plate} dataKey={v.plate} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Add Vehicle Dialog */}
      <Dialog open={addVehicleDialog} onOpenChange={setAddVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Plate Number</label>
              <Input placeholder="B XXX XXX" value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm((f) => ({ ...f, plateNumber: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Model</label>
              <Input placeholder="e.g. Isuzu NPR" value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Current Mileage</label>
              <Input type="number" placeholder="0" value={vehicleForm.mileage} onChange={(e) => setVehicleForm((f) => ({ ...f, mileage: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleAddVehicle} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Maintenance Dialog */}
      <Dialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Vehicle</label>
              <Select value={maintenanceForm.vehicleId} onValueChange={(v) => setMaintenanceForm((f) => ({ ...f, vehicleId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Service Type</label>
              <Input placeholder="e.g. Oil Change" value={maintenanceForm.type} onChange={(e) => setMaintenanceForm((f) => ({ ...f, type: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Cost</label>
              <Input type="number" placeholder="0.00" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm((f) => ({ ...f, cost: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Notes</label>
              <textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={3} placeholder="Optional notes..." value={maintenanceForm.description} onChange={(e) => setMaintenanceForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleLogMaintenance} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Maintenance Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Fleet };
export default Fleet;
