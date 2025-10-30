const mockCreate = jest.fn().mockResolvedValue({});
const mockDisconnect = jest.fn().mockResolvedValue();

class PrismaClient {
  constructor() {
    this.volunteerHistory = { create: mockCreate };
    this.$disconnect = mockDisconnect;
  }
}

module.exports = { PrismaClient, __mocks: { mockCreate, mockDisconnect } };


