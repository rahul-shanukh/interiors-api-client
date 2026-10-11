import { ConflictException } from "@nestjs/common";
import { IdempotencyService } from "./idempotency.service";

describe("IdempotencyService", () => {
  let service: IdempotencyService;
  let model: any;
  const context = {
    caller: "person@example.com",
    operation: "quote.create",
    key: "key-1",
    request: { email: "person@example.com", details: { size: 12, kind: "kitchen" } },
  };

  beforeEach(() => {
    model = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };
    service = new IdempotencyService(model);
  });

  it("fingerprints object payloads independent of property order", () => {
    expect(service.fingerprint({ b: 2, a: 1 })).toBe(service.fingerprint({ a: 1, b: 2 }));
  });

  it("returns a saved completed result", async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => ({
      requestFingerprint: service.fingerprint(context.request),
      status: "COMPLETED",
      result: { quoteId: "q1" },
    }) }) });
    await expect(service.getSavedResult(context)).resolves.toEqual({ quoteId: "q1" });
  });

  it("rejects a key reused with a changed request", async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => ({
      requestFingerprint: service.fingerprint({ changed: true }),
      status: "COMPLETED",
      result: { quoteId: "q1" },
    }) }) });
    await expect(service.getSavedResult(context)).rejects.toBeInstanceOf(ConflictException);
  });

  it("claims and completes a key within the supplied transaction", async () => {
    const session = {} as any;
    model.create.mockResolvedValue([]);
    model.updateOne.mockResolvedValue({ matchedCount: 1 });
    await service.claim(context, session);
    await service.saveResult(context, { quoteId: "q1" }, session);
    expect(model.create).toHaveBeenCalledWith(
      [expect.objectContaining({ operation: "quote.create", requestFingerprint: service.fingerprint(context.request) })],
      { session },
    );
    expect(model.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "quote.create" }),
      { $set: { status: "COMPLETED", result: { quoteId: "q1" } } },
      { session },
    );
  });

  it("uses distinct records for different operation names", async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    await service.getSavedResult(context);
    await service.getSavedResult({ ...context, operation: "quote.preview" });
    const first = model.findOne.mock.calls[0][0];
    const second = model.findOne.mock.calls[1][0];
    expect(first.scope).toBe(second.scope);
    expect(first.key).toBe(second.key);
    expect(first.operation).not.toBe(second.operation);
  });
});
