import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building2, Phone, Save, Lock, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DataTable } from '@/components/tables/DataTable';
import { getInitials } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockStaff = [
  { id: 1, name: 'George Hanna', email: 'george@almandaloun.com', role: 'Procurement Officer', canOrder: true, lastLogin: '2026-04-08 09:15' },
  { id: 2, name: 'Michel Hanna', email: 'michel@almandaloun.com', role: 'Chef', canOrder: true, lastLogin: '2026-04-07 16:30' },
  { id: 3, name: 'Layla Sarkis', email: 'layla@almandaloun.com', role: 'Store Manager', canOrder: false, lastLogin: '2026-04-06 11:00' },
];

const staffColumns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-brand-primary text-sm font-medium">{row.original.name}</p>
          <p className="text-brand-muted text-xs">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
  },
  {
    accessorKey: 'canOrder',
    header: 'Can Order',
    cell: ({ row }) => (
      <Badge variant={row.original.canOrder ? 'success' : 'default'}>
        {row.original.canOrder ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  { accessorKey: 'lastLogin', header: 'Last Login' },
];

function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || 'George Hanna',
    email: user?.email || 'george@almandaloun.com',
    company: user?.company || 'Al Mandaloun',
    phone: user?.phone || '+961 3 123 456',
    address: 'Hamra Street, Beirut, Lebanon',
    businessType: 'Restaurant',
  });
  const [addStaffDialog, setAddStaffDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  const handlePasswordChange = () => {
    if (passwords.newPass !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6 max-w-4xl"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Account Settings</h1>
        <p className="text-brand-secondary text-sm mt-1">Manage your company profile, staff, and security</p>
      </motion.div>

      {/* Company Profile */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Your business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-brand-accent/20 text-brand-accent">
                  {getInitials(form.company)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-brand-primary">{form.company}</p>
                <p className="text-sm text-brand-muted">{form.businessType}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Business Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                  <Input value={form.company} onChange={update('company')} className="pl-10" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Business Type</Label>
                <Select value={form.businessType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Supermarket">Supermarket</SelectItem>
                    <SelectItem value="Grocery">Grocery Store</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Contact Person</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                  <Input value={form.name} onChange={update('name')} className="pl-10" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                  <Input value={form.email} onChange={update('email')} className="pl-10" disabled />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                  <Input value={form.phone} onChange={update('phone')} className="pl-10" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Address</Label>
                <Input value={form.address} onChange={update('address')} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staff Management */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </div>
            <Button onClick={() => setAddStaffDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Add Staff
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={staffColumns}
              data={mockStaff}
              searchPlaceholder="Search staff..."
              searchColumn="name"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Change */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Current password"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">New Password</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  placeholder="New password"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Confirm Password</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-brand-muted text-sm flex items-center gap-1 hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPassword ? 'Hide' : 'Show'} passwords
              </button>
              <Button onClick={handlePasswordChange}>Update Password</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialog} onOpenChange={setAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Full Name</Label>
              <Input placeholder="Full name" />
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" placeholder="email@company.com" />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="store-manager">Store Manager</SelectItem>
                  <SelectItem value="procurement">Procurement Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded border-brand-border" defaultChecked />
              <Label>Can place orders</Label>
            </div>
            <Button className="w-full">Add Staff Member</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Account };
export default Account;
