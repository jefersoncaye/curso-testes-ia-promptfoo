// Tools the assistant can call.
// v1: getOrderStatus returns any order, without checking the owner (bug B7).
// v2: returns only orders that belong to the logged-in customer.
const orders = require('./data/orders.json');

function getOrderStatus(orderId, customerId, version) {
  const order = orders.find((o) => o.id === String(orderId));
  if (!order) return { found: false, orderId: String(orderId) };
  if (version === 'v2' && order.customerId !== customerId) {
    return { found: false, orderId: String(orderId) };
  }
  return { found: true, ...order };
}

module.exports = { getOrderStatus };
