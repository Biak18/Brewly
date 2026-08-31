// Verifies delivery auto-complete contract: delivered → completed
import { DELIVERY_FLOW } from "@/app/orders/[id]/tracking";

describe("delivery auto-complete contract", () => {
  it("DELIVERY_FLOW should end with delivered then completed (driver marks delivered → auto completed)", () => {
    expect(DELIVERY_FLOW[DELIVERY_FLOW.length - 2]).toBe("delivered");
    expect(DELIVERY_FLOW[DELIVERY_FLOW.length - 1]).toBe("completed");
  });
  it("delivered should be immediately before completed", () => {
    const d = DELIVERY_FLOW.indexOf("delivered" as any);
    const c = DELIVERY_FLOW.indexOf("completed" as any);
    expect(d).toBeGreaterThan(-1);
    expect(c).toBe(d + 1);
  });
});
