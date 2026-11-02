import {
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RecaptchaService } from "./recaptcha.service";

describe("RecaptchaService", () => {
  const settings = {
    RECAPTCHA_SECRET_KEY: "test-secret",
    RECAPTCHA_ALLOWED_HOSTNAMES: "localhost,example.com",
    RECAPTCHA_MIN_SCORE: "0.5",
  };
  const valid = {
    success: true,
    action: "quote_submit",
    hostname: "example.com",
    score: 0.9,
  };
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let service: RecaptchaService;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch");
    service = new RecaptchaService(new ConfigService(settings));
  });
  afterEach(() => jest.restoreAllMocks());

  it("posts credentials in the body and accepts the configured threshold", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ...valid, score: 0.5 })),
    );
    await expect(service.verify("test-token")).resolves.toBeUndefined();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(options?.method).toBe("POST");
    expect((options?.body as URLSearchParams).get("secret")).toBe(
      "test-secret",
    );
    expect((options?.body as URLSearchParams).get("response")).toBe(
      "test-token",
    );
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { ...valid, action: "login" },
    { ...valid, hostname: "example.com.attacker.test" },
    { ...valid, score: 0.49 },
    { ...valid, score: "0.9" },
    { ...valid, score: 2 },
    { success: true },
  ])("rejects untrusted verification data: %j", async (response) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response)));
    await expect(service.verify("test-token")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("rejects an empty token without contacting Google", async () => {
    await expect(service.verify(" ")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    new Error("Network failed"),
    new DOMException("Timed out", "TimeoutError"),
  ])("blocks on transport failures without retrying", async (error) => {
    fetchMock.mockRejectedValue(error);
    await expect(service.verify("test-token")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    new Response("unavailable", { status: 503 }),
    new Response("not json"),
    new Response("null"),
    new Response(
      JSON.stringify({
        success: false,
        "error-codes": ["invalid-input-secret"],
      }),
    ),
  ])("blocks invalid provider responses", async (response) => {
    fetchMock.mockResolvedValue(response);
    await expect(service.verify("test-token")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it.each([
    { RECAPTCHA_SECRET_KEY: "" },
    { RECAPTCHA_ALLOWED_HOSTNAMES: "" },
    { RECAPTCHA_ALLOWED_HOSTNAMES: "https://example.com" },
    { RECAPTCHA_ALLOWED_HOSTNAMES: "*.example.com" },
    { RECAPTCHA_MIN_SCORE: "0.5abc" },
    { RECAPTCHA_MIN_SCORE: "" },
    { RECAPTCHA_MIN_SCORE: "1.1" },
    { RECAPTCHA_MIN_SCORE: "-1" },
  ])("rejects invalid configuration: %j", (override) => {
    expect(
      () =>
        new RecaptchaService(new ConfigService({ ...settings, ...override })),
    ).toThrow();
  });
});
