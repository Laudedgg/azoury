export const ROLES = {
  SUPER_ADMIN: { value: 'SUPER_ADMIN', label: 'Super Admin', permissions: ['*'] },
  PURCHASE_MANAGER: { value: 'PURCHASE_MANAGER', label: 'Purchase Manager', permissions: ['dashboard', 'purchasing', 'inventory', 'products', 'pricing'] },
  OPERATIONS_MANAGER: { value: 'OPERATIONS_MANAGER', label: 'Operations Manager', permissions: ['dashboard', 'operations', 'receiving', 'logistics', 'inventory', 'waste', 'products', 'pricing'] },
  QUALITY_COST_CONTROL: { value: 'QUALITY_COST_CONTROL', label: 'Quality & Cost Control', permissions: ['dashboard', 'quality', 'fleet', 'waste', 'inventory'] },
  RECEIVING: { value: 'RECEIVING', label: 'Receiving Team', permissions: ['dashboard', 'receiving', 'inventory'] },
  LOGISTICS_TEAM: { value: 'LOGISTICS_TEAM', label: 'Logistics Team', permissions: ['dashboard', 'logistics'] },
  DRIVER: { value: 'DRIVER', label: 'Driver', permissions: ['deliveries'] },
  ACCOUNTANT: { value: 'ACCOUNTANT', label: 'Accountant', permissions: ['dashboard', 'reports', 'billing', 'pricing'] },
  CLIENT_ADMIN: { value: 'CLIENT_ADMIN', label: 'Client Admin', permissions: ['portal', 'orders', 'account', 'team', 'place', 'receive'] },
  CLIENT_STAFF: { value: 'CLIENT_STAFF', label: 'Client Staff', permissions: ['portal', 'orders', 'account', 'place', 'receive'] },
  CLIENT_ORDERER: { value: 'CLIENT_ORDERER', label: 'Order Placer', permissions: ['portal', 'orders', 'account', 'place'] },
  CLIENT_RECEIVER: { value: 'CLIENT_RECEIVER', label: 'Receiver / Tracker', permissions: ['portal', 'orders', 'account', 'receive'] },
};

export const INTERNAL_ROLES = ['SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER', 'QUALITY_COST_CONTROL', 'RECEIVING', 'LOGISTICS_TEAM', 'ACCOUNTANT'];
export const CLIENT_ROLES = ['CLIENT_ADMIN', 'CLIENT_STAFF', 'CLIENT_ORDERER', 'CLIENT_RECEIVER'];
export const DRIVER_ROLES = ['DRIVER'];

export const ORDER_STATUSES = {
  PENDING: { value: 'PENDING', label: 'Pending', color: 'warning' },
  CONFIRMED: { value: 'CONFIRMED', label: 'Confirmed', color: 'default' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In Progress', color: 'default' },
  READY: { value: 'READY', label: 'Ready', color: 'success' },
  DISPATCHED: { value: 'DISPATCHED', label: 'Dispatched', color: 'default' },
  DELIVERED: { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  CANCELLED: { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
};

export const QUALITY_GRADES = {
  A: { value: 'A', label: 'Grade A - Premium' },
  B: { value: 'B', label: 'Grade B - Standard' },
  C: { value: 'C', label: 'Cooking' },
  REJECT: { value: 'REJECT', label: 'Reject' },
};

export const PRODUCT_CATEGORIES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'beef', label: 'Beef' },
  { value: 'lamb', label: 'Lamb' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'produce', label: 'Produce' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'dry_goods', label: 'Dry Goods' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    DASHBOARD: '/admin',
    PURCHASING: '/admin/purchasing',
    OPERATIONS: '/admin/operations',
    QUALITY: '/admin/quality',
    RECEIVING: '/admin/receiving',
    LOGISTICS: '/admin/logistics',
    FLEET: '/admin/fleet',
    INVENTORY: '/admin/inventory',
    USERS: '/admin/users',
    REPORTS: '/admin/reports',
    WASTE: '/admin/waste',
  },
  PORTAL: {
    HOME: '/portal',
    ORDERS: '/portal/orders',
    ACCOUNT: '/portal/account',
  },
  DRIVER: {
    DELIVERIES: '/driver',
  },
};

export const CHART_COLORS = ['#4EECD3', '#4EEC90', '#4EB8EC', '#B84EEC', '#ECD34E', '#EC8A4E'];

export default {
  ROLES, INTERNAL_ROLES, CLIENT_ROLES, DRIVER_ROLES,
  ORDER_STATUSES, QUALITY_GRADES, PRODUCT_CATEGORIES, ROUTES, CHART_COLORS,
};
