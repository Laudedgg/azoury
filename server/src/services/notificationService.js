let io = null;

function initialize(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join', (room) => {
      socket.join(room);
      console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`[Socket.io] ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

function orderPlaced(order) {
  if (!io) return;
  io.to('operations').emit('orderPlaced', {
    type: 'ORDER_PLACED',
    data: {
      orderId: order.id,
      clientId: order.clientId,
      totalAmount: order.totalAmount,
      deliveryDate: order.deliveryDate,
    },
    timestamp: new Date().toISOString(),
  });
}

function orderStatusChanged(order, previousStatus) {
  if (!io) return;
  const payload = {
    type: 'ORDER_STATUS_CHANGED',
    data: {
      orderId: order.id,
      clientId: order.clientId,
      previousStatus,
      newStatus: order.status,
    },
    timestamp: new Date().toISOString(),
  };

  io.to('operations').emit('orderStatusChanged', payload);
  io.to(`client:${order.clientId}`).emit('orderStatusChanged', payload);
}

function lowStockAlert(product, qualityGrade) {
  if (!io) return;
  io.to('operations').to('purchasing').emit('lowStockAlert', {
    type: 'LOW_STOCK',
    data: {
      productId: product.id,
      productName: product.name,
      gradeId: qualityGrade.id,
      grade: qualityGrade.grade,
      currentStock: qualityGrade.currentStock,
    },
    timestamp: new Date().toISOString(),
  });
}

function dispatchUpdate(dispatch, status) {
  if (!io) return;
  io.to('operations').to('logistics').emit('dispatchUpdate', {
    type: 'DISPATCH_UPDATE',
    data: {
      dispatchId: dispatch.id,
      driverId: dispatch.driverId,
      status,
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  initialize,
  orderPlaced,
  orderStatusChanged,
  lowStockAlert,
  dispatchUpdate,
};
