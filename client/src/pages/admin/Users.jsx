import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Building2, Check, X, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { DataTable } from '@/components/tables/DataTable';
import { formatDate, getInitials } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';
import { useFetch } from '@/hooks/useFetch';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockStaff = [
  { id: 1, name: 'Karim Haddad', email: 'karim@azoury.com', role: 'SUPER_ADMIN', status: 'Active', lastLogin: '2026-04-08 09:15', phone: '+961 3 123 456' },
  { id: 2, name: 'Sami Rashid', email: 'sami@azoury.com', role: 'QC_MANAGER', status: 'Active', lastLogin: '2026-04-08 08:30', phone: '+961 3 234 567' },
  { id: 3, name: 'Ali Mansour', email: 'ali@azoury.com', role: 'RECEIVING', status: 'Active', lastLogin: '2026-04-08 07:00', phone: '+961 3 345 678' },
  { id: 4, name: 'Hassan Khalil', email: 'hassan@azoury.com', role: 'RECEIVING', status: 'Active', lastLogin: '2026-04-07 16:30', phone: '+961 3 456 789' },
  { id: 5, name: 'Omar Saeed', email: 'omar@azoury.com', role: 'DRIVER', status: 'Active', lastLogin: '2026-04-08 06:30', phone: '+961 3 567 890' },
  { id: 6, name: 'Ahmad Khalil', email: 'ahmad@azoury.com', role: 'DRIVER', status: 'Active', lastLogin: '2026-04-08 06:45', phone: '+961 3 678 901' },
  { id: 7, name: 'Hassan Mousa', email: 'hmousa@azoury.com', role: 'DRIVER', status: 'Inactive', lastLogin: '2026-03-15 14:00', phone: '+961 3 789 012' },
  { id: 8, name: 'Nadia Farah', email: 'nadia@azoury.com', role: 'OPERATIONS', status: 'Active', lastLogin: '2026-04-08 08:00', phone: '+961 3 890 123' },
  { id: 9, name: 'Rami Khoury', email: 'rami@azoury.com', role: 'PURCHASING', status: 'Active', lastLogin: '2026-04-08 09:00', phone: '+961 3 901 234' },
];

const mockClients = [
  {
    id: 1, businessName: 'Al Mandaloun', type: 'Restaurant', contact: 'George Hanna', email: 'george@almandaloun.com',
    status: 'Approved', staffCount: 3,
    staff: [
      { id: 101, name: 'George Hanna', role: 'Procurement Officer', canOrder: true },
      { id: 102, name: 'Michel Hanna', role: 'Chef', canOrder: true },
      { id: 103, name: 'Layla Sarkis', role: 'Store Manager', canOrder: false },
    ],
  },
  {
    id: 2, businessName: 'Le Petit Chef', type: 'Restaurant', contact: 'Antoine Rizk', email: 'antoine@lepetitchef.com',
    status: 'Approved', staffCount: 2,
    staff: [
      { id: 201, name: 'Antoine Rizk', role: 'Chef', canOrder: true },
      { id: 202, name: 'Carla Makhoul', role: 'Procurement Officer', canOrder: true },
    ],
  },
  {
    id: 3, businessName: 'Fresh Market', type: 'Supermarket', contact: 'Samir Nassar', email: 'samir@freshmarket.com',
    status: 'Approved', staffCount: 4,
    staff: [
      { id: 301, name: 'Samir Nassar', role: 'Store Manager', canOrder: true },
      { id: 302, name: 'Hala Badr', role: 'Procurement Officer', canOrder: true },
      { id: 303, name: 'Fadi Karam', role: 'Store Manager', canOrder: false },
      { id: 304, name: 'Mira Jaber', role: 'Chef', canOrder: false },
    ],
  },
  {
    id: 4, businessName: 'Karam Beirut', type: 'Restaurant', contact: 'Walid Karam', email: 'walid@karambeirut.com',
    status: 'Approved', staffCount: 2,
    staff: [
      { id: 401, name: 'Walid Karam', role: 'Chef', canOrder: true },
      { id: 402, name: 'Rania Saab', role: 'Procurement Officer', canOrder: true },
    ],
  },
  {
    id: 5, businessName: 'Green Grocer', type: 'Grocery', contact: 'Tarek Youssef', email: 'tarek@greengrocer.com',
    status: 'Pending', staffCount: 1,
    staff: [
      { id: 501, name: 'Tarek Youssef', role: 'Store Manager', canOrder: true },
    ],
  },
  {
    id: 6, businessName: 'Byblos Kitchen', type: 'Restaurant', contact: 'Lina Aoun', email: 'lina@bybloskitchen.com',
    status: 'Pending', staffCount: 1,
    staff: [
      { id: 601, name: 'Lina Aoun', role: 'Chef', canOrder: true },
    ],
  },
];

const staffColumns = [
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-brand-primary">{row.original.name}</p>
          <p className="text-xs text-brand-muted">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{ROLES[row.original.role]?.label || row.original.role}</Badge>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={row.original.status === 'Active' ? 'success' : 'error'}>{row.original.status}</Badge>,
  },
  { accessorKey: 'lastLogin', header: 'Last Login' },
  { accessorKey: 'phone', header: 'Phone' },
];

const clientColumns = [
  { accessorKey: 'businessName', header: 'Business Name' },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge> },
  { accessorKey: 'contact', header: 'Contact Person' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={row.original.status === 'Approved' ? 'success' : 'warning'}>{row.original.status}</Badge>,
  },
  { accessorKey: 'staffCount', header: 'Staff' },
];

function Users() {
  const [addStaffDialog, setAddStaffDialog] = useState(false);
  const [expandedClient, setExpandedClient] = useState(null);

  const { data: apiData } = useFetch('/users');

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">User Management</h1>
        <p className="text-brand-secondary text-sm mt-1">Manage internal staff and client accounts</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="staff">
          <TabsList>
            <TabsTrigger value="staff">
              <Shield className="w-4 h-4 mr-2" /> Internal Staff
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Building2 className="w-4 h-4 mr-2" /> Client Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddStaffDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Staff
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={staffColumns}
                  data={apiData?.users || mockStaff}
                  searchPlaceholder="Search staff..."
                  searchColumn="name"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-6 space-y-4">
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={clientColumns}
                  data={mockClients}
                  searchPlaceholder="Search clients..."
                  searchColumn="businessName"
                />
              </CardContent>
            </Card>

            {/* Expandable client detail */}
            <div className="space-y-3">
              {mockClients.map((client) => (
                <Card key={client.id} className={client.status === 'Pending' ? 'border-brand-warning/30' : ''}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-brand-accent" />
                        <div>
                          <p className="text-brand-primary font-medium">{client.businessName}</p>
                          <p className="text-brand-muted text-xs">{client.type} - {client.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={client.status === 'Approved' ? 'success' : 'warning'}>{client.status}</Badge>
                        {client.status === 'Pending' && (
                          <Button size="sm" variant="outline">
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform ${expandedClient === client.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {expandedClient === client.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-brand-border"
                      >
                        <h4 className="text-brand-secondary text-sm font-medium mb-3">Staff Members ({client.staff.length})</h4>
                        <div className="space-y-2">
                          {client.staff.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2 bg-brand-elevated rounded-lg">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{getInitials(s.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-brand-primary text-sm">{s.name}</span>
                                <Badge variant="outline" className="text-xs">{s.role}</Badge>
                              </div>
                              <Badge variant={s.canOrder ? 'success' : 'default'} className="text-xs">
                                {s.canOrder ? 'Can Order' : 'View Only'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialog} onOpenChange={setAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">First Name</label>
                <Input placeholder="First name" />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Last Name</label>
                <Input placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Email</label>
              <Input type="email" placeholder="email@azoury.com" />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Role</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="PURCHASING">Purchase Manager</SelectItem>
                  <SelectItem value="OPERATIONS">Operations Manager</SelectItem>
                  <SelectItem value="QC_MANAGER">QC Manager</SelectItem>
                  <SelectItem value="RECEIVING">Receiving Team</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Phone</label>
              <Input placeholder="+961 X XXX XXX" />
            </div>
            <Button className="w-full">Add Staff Member</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Users };
export default Users;
