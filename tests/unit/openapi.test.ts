import Ajv from "ajv";
import { expect, it } from "vitest";
import openapi from "../../docs/openapi.json";

it("accepts a registered resident check-in with the captured hostel scope", () => {
  const validate = new Ajv({ strict: false }).compile(
    openapi.components.schemas.checkInRequest,
  );
  const checkIn = {
    residentId: "resident-1",
    roomId: "room-1",
    bedId: "bed-1",
    ratePlanId: "rate-plan-1",
    agreedRentPaise: "90000",
    agreedDepositPaise: "100000",
    billingDay: "1",
    checkInDate: "2026-11-09",
    departureIntent: "unknown",
    stayKind: "short",
  };
  expect(validate({ ...checkIn, expectedHostelId: "hostel-1" }), JSON.stringify(validate.errors)).toBe(true);
  expect(validate(checkIn)).toBe(true);
  expect(validate({ ...checkIn, expectedHostelId: "" })).toBe(false);
});
