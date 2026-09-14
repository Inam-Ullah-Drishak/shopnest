// Single source of truth for the checkout maths. The client needs these to
// show a total on the review page before the order exists, and the server
// needs them to work out what to actually charge. They used to be declared
// separately in each, which meant a change in one place silently produced a
// review page whose total didn't match the invoice.
//
// Served to the client by GET /api/config.
export const SHIPPING_PRICE = 200;
export const FREE_SHIPPING_OVER = 5000;

export const storeConfig = {
  shippingPrice: SHIPPING_PRICE,
  freeShippingOver: FREE_SHIPPING_OVER,
};