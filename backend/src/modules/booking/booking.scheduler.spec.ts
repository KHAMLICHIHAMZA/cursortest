import { Test, TestingModule } from "@nestjs/testing";
import { BookingScheduler } from "./booking.scheduler";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BookingStatus, VehicleStatus } from "@prisma/client";

describe("BookingScheduler", () => {
  let scheduler: BookingScheduler;
  let prismaService: PrismaService;

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    vehicle: {
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingScheduler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    scheduler = module.get<BookingScheduler>(BookingScheduler);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("markNoShowBookings", () => {
    it("should mark PENDING bookings with passed startDate as NO_SHOW", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockBookings = [
        {
          id: "booking-1",
          bookingNumber: "RES-001",
          status: BookingStatus.PENDING,
          startDate: pastDate,
          checkInAt: null,
          vehicleId: "vehicle-1",
          vehicle: { id: "vehicle-1", status: VehicleStatus.RESERVED },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.vehicle.update.mockResolvedValue({});

      await scheduler.markNoShowBookings();

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            checkInAt: null,
          }),
        }),
      );

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "booking-1" },
          data: expect.objectContaining({
            status: BookingStatus.NO_SHOW,
          }),
        }),
      );

      // Vehicle should be released
      expect(mockPrismaService.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "vehicle-1" },
          data: expect.objectContaining({
            status: VehicleStatus.AVAILABLE,
          }),
        }),
      );
    });

    it("should not mark bookings with future startDate", async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await scheduler.markNoShowBookings();

      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it("should not mark bookings that have checkInAt", async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await scheduler.markNoShowBookings();

      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });
  });

  describe("markLateBookings", () => {
    it("should mark IN_PROGRESS bookings with passed endDate as LATE", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockBookings = [
        {
          id: "booking-2",
          bookingNumber: "RES-002",
          status: BookingStatus.IN_PROGRESS,
          endDate: pastDate,
          checkOutAt: null,
          vehicleId: "vehicle-2",
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.update.mockResolvedValue({});

      await scheduler.markLateBookings();

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [BookingStatus.IN_PROGRESS, BookingStatus.EXTENDED] },
            checkOutAt: null,
          }),
        }),
      );

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "booking-2" },
          data: expect.objectContaining({
            status: BookingStatus.LATE,
          }),
        }),
      );
    });

    it("should not release vehicle when marking as LATE", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockBookings = [
        {
          id: "booking-3",
          status: BookingStatus.IN_PROGRESS,
          endDate: pastDate,
          checkOutAt: null,
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.update.mockResolvedValue({});

      await scheduler.markLateBookings();

      // Vehicle should NOT be updated (stays RENTED)
      expect(mockPrismaService.vehicle.update).not.toHaveBeenCalled();
    });
  });

  describe("alertUpcomingReturns", () => {
    it("should find bookings returning tomorrow", async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await scheduler.alertUpcomingReturns();

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookingStatus.IN_PROGRESS,
          }),
        }),
      );
    });
  });

  describe("runAllChecks", () => {
    it("should run all checks in sequence", async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const markNoShowSpy = jest.spyOn(scheduler, "markNoShowBookings");
      const markLateSpy = jest.spyOn(scheduler, "markLateBookings");
      const alertSpy = jest.spyOn(scheduler, "alertUpcomingReturns");

      await scheduler.runAllChecks();

      expect(markNoShowSpy).toHaveBeenCalled();
      expect(markLateSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
    });
  });
});
