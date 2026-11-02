import {
  ConflictException,
  ForbiddenException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { QuoteService } from "./quote.service";
import { AnyQuoteRequestDto } from "../dto/base-quote-request.dto";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";

describe("Quote submission reCAPTCHA integration", () => {
  const dto: AnyQuoteRequestDto = {
    calculatorType: CalculatorType.KITCHEN,
    configuration: {
      layout: "Straight",
      builtupArea: "8ft",
      package: "Premium",
    },
    name: "Test User",
    email: "test@example.com",
    phone: "+919876543210",
    location: {
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      latitude: 12.97,
      longitude: 77.59,
    },
    recaptchaToken: "test-token",
  };

  function setup() {
    const connection = { startSession: jest.fn() };
    const model = { findOneAndUpdate: jest.fn() };
    const notifications = { dispatch: jest.fn() };
    const guard = {
      isDuplicateSubmission: jest
        .fn()
        .mockResolvedValue({ fingerprint: "test", isDuplicate: true }),
    };
    const limiter = { check: jest.fn().mockResolvedValue(undefined) };
    const recaptcha = { verify: jest.fn().mockResolvedValue(undefined) };
    const args = [
      connection,
      model,
      model,
      model,
      {},
      notifications,
      {},
      guard,
      {},
      limiter,
      recaptcha,
    ];
    const service = new QuoteService(
      ...(args as unknown as ConstructorParameters<typeof QuoteService>),
    );
    return {
      service,
      connection,
      model,
      notifications,
      guard,
      limiter,
      recaptcha,
    };
  }

  afterEach(() => jest.restoreAllMocks());

  it.each([new ForbiddenException(), new ServiceUnavailableException()])(
    "stops before duplicate handling or side effects when verification fails",
    async (error) => {
      const test = setup();
      test.recaptcha.verify.mockRejectedValue(error);
      await expect(
        test.service.createQuoteRequest(dto, "127.0.0.1", "test-key"),
      ).rejects.toBe(error);
      expect(test.recaptcha.verify).toHaveBeenCalledWith(
        "test-token",
        "quote_submit",
      );
      expect(test.guard.isDuplicateSubmission).not.toHaveBeenCalled();
      expect(test.connection.startSession).not.toHaveBeenCalled();
      expect(test.model.findOneAndUpdate).not.toHaveBeenCalled();
      expect(test.notifications.dispatch).not.toHaveBeenCalled();
    },
  );

  it("allows verified requests to proceed to duplicate handling", async () => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const test = setup();
    await expect(
      test.service.createQuoteRequest(dto, "127.0.0.1", "test-key"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(test.recaptcha.verify.mock.invocationCallOrder[0]).toBeLessThan(
      test.guard.isDuplicateSubmission.mock.invocationCallOrder[0],
    );
  });

  it("does not consume a token when the request is already rate limited", async () => {
    const test = setup();
    test.limiter.check.mockRejectedValue(new Error("Rate limited"));
    await expect(
      test.service.createQuoteRequest(dto, "127.0.0.1", "test-key"),
    ).rejects.toThrow("Rate limited");
    expect(test.recaptcha.verify).not.toHaveBeenCalled();
  });
});
