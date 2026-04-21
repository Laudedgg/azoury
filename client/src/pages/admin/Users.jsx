import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Building2, Check, X, ChevronDown, Loader2, Copy, Plus, Pencil, UserX, UserCheck } from 'lucide-react';
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
import { ROLES, INTERNAL_ROLES } from '@/utils/constants';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const BUSINESS_TYPES = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'SUPERMARKET', label: 'Supermarket' },
  { value: 'GROCERY', label: 'Grocery' },
  { value: 'OTHER', label: 'Other' },
];

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  const arr = new Uint32Array(len);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

const emptyStaffForm = { firstName: '', lastName: '', email: '', role: '', phone: '', password: '' };
const emptyClientForm = {
  businessName: '', businessType: '', contactPerson: '', email: '', phone: '', address: '',
  adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '', adminPassword: '',
};
const emptyClientStaffForm = { firstName: '', lastName: '', email: '', role: 'CLIENT_STAFF', phone: '', password: '' };
const emptyEditForm = { firstName: '', lastName: '', email: '', role: '', phone: '' };

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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Copy failed')
  );
}

function Users() {
  const [addStaffDialog, setAddStaffDialog] = useState(false);
  const [addClientDialog, setAddClientDialog] = useState(false);
  const [addClientStaffDialog, setAddClientStaffDialog] = useState(false);
  const [targetClientId, setTargetClientId] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [clientStaff, setClientStaff] = useState({});
  const [loadingStaff, setLoadingStaff] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [editDialog, setEditDialog] = useState(null); // { user, parentClientId? }
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientStaffForm, setClientStaffForm] = useState(emptyClientStaffForm);

  const { data: usersData, refetch: refetchUsers } = useFetch('/users?page=1&limit=50');
  const { data: clientsData, refetch: refetchClients } = useFetch('/clients?page=1&limit=50');

  const staff = (usersData?.data || [])
    .filter((u) => INTERNAL_ROLES.includes(u.role) || u.role === 'DRIVER')
    .map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      status: u.isActive ? 'Active' : 'Inactive',
      lastLogin: u.lastLogin || '-',
      phone: u.phone || '-',
    }));

  const clients = (clientsData?.data || []).map((c) => ({
    id: c.id,
    businessName: c.businessName,
    type: c.businessType || 'OTHER',
    contact: c.contactPerson || '-',
    email: c.email || '-',
    phone: c.phone || '-',
    status: c.isApproved ? 'Approved' : 'Pending',
    staffCount: c._count?.users || 0,
  }));

  useEffect(() => {
    if (expandedClient && !clientStaff[expandedClient] && !loadingStaff[expandedClient]) {
      setLoadingStaff((prev) => ({ ...prev, [expandedClient]: true }));
      api.get(`/clients/${expandedClient}/staff`)
        .then((res) => {
          setClientStaff((prev) => ({ ...prev, [expandedClient]: res.data }));
        })
        .catch(() => {
          setClientStaff((prev) => ({ ...prev, [expandedClient]: [] }));
        })
        .finally(() => {
          setLoadingStaff((prev) => ({ ...prev, [expandedClient]: false }));
        });
    }
  }, [expandedClient]);

  const refetchClientStaff = async (clientId) => {
    try {
      const res = await api.get(`/clients/${clientId}/staff`);
      setClientStaff((prev) => ({ ...prev, [clientId]: res.data }));
    } catch {
      setClientStaff((prev) => ({ ...prev, [clientId]: [] }));
    }
  };

  const handleAddStaff = async () => {
    if (!staffForm.firstName || !staffForm.email || !staffForm.role || !staffForm.password) {
      toast.error('First name, email, role, and password are required');
      return;
    }
    if (staffForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        email: staffForm.email,
        role: staffForm.role,
        phone: staffForm.phone,
        password: staffForm.password,
      });
      toast.success('Staff member added. They must change their password on first login.');
      setAddStaffDialog(false);
      setStaffForm(emptyStaffForm);
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClient = async () => {
    const required = ['businessName', 'businessType', 'contactPerson', 'email', 'phone', 'address',
      'adminFirstName', 'adminEmail', 'adminPassword'];
    for (const field of required) {
      if (!clientForm[field]) {
        toast.error(`Missing field: ${field}`);
        return;
      }
    }
    if (clientForm.adminPassword.length < 6) {
      toast.error('Admin password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const clientRes = await api.post('/clients', {
        businessName: clientForm.businessName,
        businessType: clientForm.businessType,
        contactPerson: clientForm.contactPerson,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address,
      });
      const newClientId = clientRes.data.id;

      await api.post(`/clients/${newClientId}/staff`, {
        firstName: clientForm.adminFirstName,
        lastName: clientForm.adminLastName,
        email: clientForm.adminEmail,
        phone: clientForm.adminPhone,
        role: 'CLIENT_ADMIN',
        password: clientForm.adminPassword,
      });

      toast.success('Client organization and admin account created');
      setAddClientDialog(false);
      setClientForm(emptyClientForm);
      refetchClients();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClientStaff = async () => {
    if (!clientStaffForm.firstName || !clientStaffForm.email || !clientStaffForm.password) {
      toast.error('First name, email, and password are required');
      return;
    }
    if (clientStaffForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/clients/${targetClientId}/staff`, {
        firstName: clientStaffForm.firstName,
        lastName: clientStaffForm.lastName,
        email: clientStaffForm.email,
        phone: clientStaffForm.phone,
        role: clientStaffForm.role,
        password: clientStaffForm.password,
      });
      toast.success('Staff added to client');
      setAddClientStaffDialog(false);
      setClientStaffForm(emptyClientStaffForm);
      await refetchClientStaff(targetClientId);
      refetchClients();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add client staff');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditUser = (user, parentClientId) => {
    setEditDialog({ user, parentClientId });
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      phone: user.phone || '',
    });
  };

  const handleEditUser = async () => {
    if (!editDialog) return;
    if (!editForm.firstName || !editForm.email || !editForm.role) {
      toast.error('First name, email, and role are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/users/${editDialog.user.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone,
      });
      toast.success('User updated');
      setEditDialog(null);
      if (editDialog.parentClientId) {
        await refetchClientStaff(editDialog.parentClientId);
      } else {
        refetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId, parentClientId) => {
    setTogglingId(userId);
    try {
      await api.patch(`/users/${userId}/toggle-active`);
      toast.success('Status updated');
      if (parentClientId) {
        await refetchClientStaff(parentClientId);
      } else {
        refetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleApproveClient = async (e, clientId) => {
    e.stopPropagation();
    setApprovingId(clientId);
    try {
      await api.patch(`/clients/${clientId}/approve`);
      toast.success('Client approved');
      refetchClients();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve client');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="hidden lg:block">
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
                  columns={[
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
                      cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'error'}>{row.original.status}</Badge>,
                    },
                    { accessorKey: 'phone', header: 'Phone' },
                    {
                      id: 'actions',
                      header: '',
                      cell: ({ row }) => (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => openEditUser(row.original)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 px-2 ${row.original.isActive ? 'text-brand-error' : 'text-brand-success'}`}
                            disabled={togglingId === row.original.id}
                            onClick={() => {
                              const action = row.original.isActive ? 'Deactivate' : 'Reactivate';
                              if (!window.confirm(`${action} ${row.original.name}?`)) return;
                              handleToggleActive(row.original.id);
                            }}
                          >
                            {togglingId === row.original.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : row.original.isActive ? (
                              <UserX className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={staff}
                  searchPlaceholder="Search staff..."
                  searchColumn="name"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddClientDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Client Organization
              </Button>
            </div>

            {/* Pending approvals banner */}
            {clients.filter((c) => c.status === 'Pending').length > 0 && (
              <Card className="border-brand-warning/40 bg-brand-warning/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-brand-warning" />
                    <h3 className="text-brand-primary font-semibold text-sm">
                      Pending Approvals ({clients.filter((c) => c.status === 'Pending').length})
                    </h3>
                  </div>
                  <p className="text-brand-secondary text-xs mb-3">
                    New client registrations waiting for approval. Approved accounts can log in immediately.
                  </p>
                  <div className="space-y-2">
                    {clients.filter((c) => c.status === 'Pending').map((c) => (
                      <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-brand-elevated rounded-lg border border-brand-border">
                        <div className="min-w-0">
                          <p className="text-brand-primary font-medium text-sm truncate">{c.businessName}</p>
                          <p className="text-brand-muted text-xs truncate">{c.type} · {c.contact} · {c.email}</p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 w-full sm:w-auto"
                          disabled={approvingId === c.id}
                          onClick={(e) => handleApproveClient(e, c.id)}
                        >
                          {approvingId === c.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                          Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={clientColumns}
                  data={clients}
                  searchPlaceholder="Search clients..."
                  searchColumn="businessName"
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {clients.map((client) => (
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
                          <Button size="sm" variant="outline" disabled={approvingId === client.id} onClick={(e) => handleApproveClient(e, client.id)}>
                            {approvingId === client.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Approve
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
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-brand-secondary text-sm font-medium">
                            Staff Members ({(clientStaff[client.id] || []).length})
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetClientId(client.id);
                              setClientStaffForm(emptyClientStaffForm);
                              setAddClientStaffDialog(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3 mr-1" /> Add Staff
                          </Button>
                        </div>
                        {loadingStaff[client.id] ? (
                          <div className="flex items-center gap-2 text-brand-muted text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading staff...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(clientStaff[client.id] || []).length === 0 && (
                              <p className="text-brand-muted text-xs py-2">No staff yet.</p>
                            )}
                            {(clientStaff[client.id] || []).map((s) => {
                              const displayName = s.firstName ? `${s.firstName} ${s.lastName}` : (s.name || 'Unknown');
                              return (
                                <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-brand-elevated rounded-lg">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-brand-primary text-sm truncate">{displayName}</span>
                                        <Badge variant="outline" className="text-[10px]">{ROLES[s.role]?.label || s.role}</Badge>
                                      </div>
                                      <span className="text-brand-muted text-xs truncate block">{s.email}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Badge variant={s.isActive ? 'success' : 'default'} className="text-[10px]">
                                      {s.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => { e.stopPropagation(); openEditUser(s, client.id); }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`h-7 px-2 ${s.isActive ? 'text-brand-error' : 'text-brand-success'}`}
                                      disabled={togglingId === s.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const action = s.isActive ? 'Deactivate' : 'Reactivate';
                                        if (!window.confirm(`${action} ${displayName}?`)) return;
                                        handleToggleActive(s.id, client.id);
                                      }}
                                    >
                                      {togglingId === s.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : s.isActive ? (
                                        <UserX className="w-3 h-3" />
                                      ) : (
                                        <UserCheck className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                <label className="block text-brand-secondary text-sm mb-1">First Name *</label>
                <Input value={staffForm.firstName} onChange={(e) => setStaffForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Last Name</label>
                <Input value={staffForm.lastName} onChange={(e) => setStaffForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Email *</label>
              <Input type="email" placeholder="email@azoury.com" value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Role *</label>
              <Select value={staffForm.role} onValueChange={(val) => setStaffForm((f) => ({ ...f, role: val }))}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {INTERNAL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLES[r]?.label || r}</SelectItem>
                  ))}
                  <SelectItem value="DRIVER">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Phone</label>
              <Input placeholder="+961 X XXX XXX" value={staffForm.phone} onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Temporary Password *</label>
              <div className="flex gap-2">
                <Input value={staffForm.password} onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                <Button type="button" variant="outline" onClick={() => setStaffForm((f) => ({ ...f, password: generatePassword() }))}>
                  Generate
                </Button>
                {staffForm.password && (
                  <Button type="button" variant="outline" onClick={() => copyToClipboard(staffForm.password)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-brand-muted text-xs mt-1">User will be required to change this on first login.</p>
            </div>
            <Button className="w-full" onClick={handleAddStaff} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Organization Dialog */}
      <Dialog open={addClientDialog} onOpenChange={setAddClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Client Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <h4 className="text-brand-primary text-sm font-medium mb-3">Business Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Business Name *</label>
                  <Input value={clientForm.businessName} onChange={(e) => setClientForm((f) => ({ ...f, businessName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Business Type *</label>
                  <Select value={clientForm.businessType} onValueChange={(val) => setClientForm((f) => ({ ...f, businessType: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Contact Person *</label>
                  <Input value={clientForm.contactPerson} onChange={(e) => setClientForm((f) => ({ ...f, contactPerson: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Business Phone *</label>
                  <Input value={clientForm.phone} onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-brand-secondary text-sm mb-1">Business Email *</label>
                  <Input type="email" value={clientForm.email} onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-brand-secondary text-sm mb-1">Address *</label>
                  <Input value={clientForm.address} onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border pt-4">
              <h4 className="text-brand-primary text-sm font-medium mb-3">Client Admin Account</h4>
              <p className="text-brand-muted text-xs mb-3">This person will log in and manage their own staff.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">First Name *</label>
                  <Input value={clientForm.adminFirstName} onChange={(e) => setClientForm((f) => ({ ...f, adminFirstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Last Name</label>
                  <Input value={clientForm.adminLastName} onChange={(e) => setClientForm((f) => ({ ...f, adminLastName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Admin Email *</label>
                  <Input type="email" value={clientForm.adminEmail} onChange={(e) => setClientForm((f) => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Admin Phone</label>
                  <Input value={clientForm.adminPhone} onChange={(e) => setClientForm((f) => ({ ...f, adminPhone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-brand-secondary text-sm mb-1">Temporary Password *</label>
                  <div className="flex gap-2">
                    <Input value={clientForm.adminPassword} onChange={(e) => setClientForm((f) => ({ ...f, adminPassword: e.target.value }))} placeholder="Min 6 characters" />
                    <Button type="button" variant="outline" onClick={() => setClientForm((f) => ({ ...f, adminPassword: generatePassword() }))}>
                      Generate
                    </Button>
                    {clientForm.adminPassword && (
                      <Button type="button" variant="outline" onClick={() => copyToClipboard(clientForm.adminPassword)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-brand-muted text-xs mt-1">Admin will be required to change this on first login.</p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleAddClient} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Client Organization'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Staff Dialog */}
      <Dialog open={addClientStaffDialog} onOpenChange={setAddClientStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">First Name *</label>
                <Input value={clientStaffForm.firstName} onChange={(e) => setClientStaffForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Last Name</label>
                <Input value={clientStaffForm.lastName} onChange={(e) => setClientStaffForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Email *</label>
              <Input type="email" value={clientStaffForm.email} onChange={(e) => setClientStaffForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Role *</label>
              <Select value={clientStaffForm.role} onValueChange={(val) => setClientStaffForm((f) => ({ ...f, role: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                  <SelectItem value="CLIENT_STAFF">Client Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Phone</label>
              <Input value={clientStaffForm.phone} onChange={(e) => setClientStaffForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Temporary Password *</label>
              <div className="flex gap-2">
                <Input value={clientStaffForm.password} onChange={(e) => setClientStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                <Button type="button" variant="outline" onClick={() => setClientStaffForm((f) => ({ ...f, password: generatePassword() }))}>
                  Generate
                </Button>
                {clientStaffForm.password && (
                  <Button type="button" variant="outline" onClick={() => copyToClipboard(clientStaffForm.password)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-brand-muted text-xs mt-1">User will be required to change this on first login.</p>
            </div>
            <Button className="w-full" onClick={handleAddClientStaff} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => { if (!open) setEditDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">First Name *</label>
                  <Input value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-brand-secondary text-sm mb-1">Last Name</label>
                  <Input value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Email *</label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Role *</label>
                <Select value={editForm.role} onValueChange={(val) => setEditForm((f) => ({ ...f, role: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {editDialog.parentClientId ? (
                      <>
                        <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                        <SelectItem value="CLIENT_STAFF">Client Staff</SelectItem>
                      </>
                    ) : (
                      <>
                        {INTERNAL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLES[r]?.label || r}</SelectItem>
                        ))}
                        <SelectItem value="DRIVER">Driver</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Phone</label>
                <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleEditUser} disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Users };
export default Users;
