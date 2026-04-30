import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building2, Phone, Save, Lock, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
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

const TEAM_ROLE_LABELS = {
  CLIENT_ADMIN: 'Admin',
  CLIENT_STAFF: 'Full Access',
  CLIENT_ORDERER: 'Order Placer',
  CLIENT_RECEIVER: 'Receiver',
};

const staffColumns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const s = row.original;
      const fullName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-brand-primary text-sm font-medium">{fullName}</p>
            <p className="text-brand-muted text-xs">{s.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{TEAM_ROLE_LABELS[row.original.role] || row.original.role}</Badge>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'default'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
];

function Account() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const { data: clientData, refetch: refetchClient } = useFetch(clientId ? `/clients/${clientId}` : null);
  const { data: staffData, refetch: refetchStaff } = useFetch(clientId ? `/clients/${clientId}/staff` : null);

  const client = clientData || {};
  const staff = Array.isArray(staffData) ? staffData : (staffData?.data || []);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    phone: '',
    address: '',
    businessType: 'Restaurant',
  });
  const [formInit, setFormInit] = useState(false);
  const isAdmin = user?.role === 'CLIENT_ADMIN';
  const [addStaffDialog, setAddStaffDialog] = useState(false);
  const [newStaff, setNewStaff] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'CLIENT_ORDERER', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  // Initialize form from fetched client data
  React.useEffect(() => {
    if (client?.id && !formInit) {
      setForm({
        name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        company: client.businessName || '',
        phone: client.phone || '',
        address: client.address || '',
        businessType: client.businessType || 'Restaurant',
      });
      setFormInit(true);
    }
  }, [client, user, formInit]);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      await api.put(`/clients/${clientId}`, {
        businessName: form.company,
        phone: form.phone,
        address: form.address,
        businessType: form.businessType,
      });
      toast.success('Profile updated successfully');
      refetchClient();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async () => {
    if (!clientId) return;
    if (!newStaff.firstName || !newStaff.email || !newStaff.password) {
      toast.error('First name, email, and password are required');
      return;
    }
    if (newStaff.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post(`/clients/${clientId}/staff`, newStaff);
      toast.success('Team member added — they must change their password on first login.');
      setAddStaffDialog(false);
      setNewStaff({ firstName: '', lastName: '', email: '', password: '', role: 'CLIENT_ORDERER', phone: '' });
      refetchStaff();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to add team member');
    }
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
      className="space-y-4 lg:space-y-6 max-w-4xl"
    >
      <motion.div variants={fadeInUp} className="hidden lg:block">
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
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Management — admin-only */}
      {isAdmin && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Add sub-logins for your team. Order Placers can browse and place orders.
                  Receivers can track active deliveries and request returns or refunds.
                  No financial data is exposed to either role.
                </CardDescription>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => setAddStaffDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add team member
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={staffColumns}
                data={staff}
                searchPlaceholder="Search team..."
                searchColumn="name"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Add Team Member Dialog */}
      <Dialog open={addStaffDialog} onOpenChange={setAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Role *</Label>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT_ORDERER">Order Placer — browse catalog & place orders</SelectItem>
                  <SelectItem value="CLIENT_RECEIVER">Receiver — track deliveries & request returns</SelectItem>
                  <SelectItem value="CLIENT_STAFF">Full Access — both place and receive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-brand-muted text-xs mt-1.5">No financial data (totals, prices, billing) is exposed to any of these roles.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">First Name *</Label>
                <Input placeholder="First name" value={newStaff.firstName} onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Last Name</Label>
                <Input placeholder="Last name" value={newStaff.lastName} onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Email *</Label>
              <Input type="email" placeholder="email@company.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Phone</Label>
              <Input placeholder="+961 ..." value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Temporary password *</Label>
              <Input type="password" placeholder="Min 6 characters" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
              <p className="text-brand-muted text-xs mt-1.5">They will be required to change it on first login.</p>
            </div>
            <Button className="w-full" onClick={handleAddStaff}>Add team member</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Account };
export default Account;
