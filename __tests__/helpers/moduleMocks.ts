export const moduleMocks = {
  orderService: {
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
  emailService: {
    sendEmail: jest.fn(),
    sendContactFormConfirmation: jest.fn(),
  },
  shippingService: {
    getShippingRates: jest.fn(),
    getSupportedCountries: jest.fn(),
    getCarrierServices: jest.fn(),
    validatePostalCode: jest.fn(),
    calculateShipping: jest.fn(),
    calculateEcoShipping: jest.fn(),
    calculateSwedishShipping: jest.fn(),
    validateAddress: jest.fn(),
    getHolidayImpact: jest.fn(),
    getAllShippingOptions: jest.fn(),
  },
};