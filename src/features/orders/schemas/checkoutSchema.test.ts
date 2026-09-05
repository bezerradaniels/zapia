import { describe, it, expect } from "vitest";
import { checkoutSchema } from "./index";

describe("checkoutSchema", () => {
  it("validates valid customer input with standard 11-digit phone", () => {
    const input = {
      name: "João da Silva",
      phone: "(11) 98765-4321",
      notes: "Entregar após as 18h",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates valid customer input with 10-digit landline or commercial phone", () => {
    const input = {
      name: "Maria Souza",
      phone: "(21) 2233-4455",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates unformatted raw phone numbers", () => {
    const input = {
      name: "Carlos",
      phone: "77999887766",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects names shorter than 2 characters", () => {
    const input = {
      name: "J",
      phone: "(11) 98765-4321",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Informe seu nome");
    }
  });

  it("rejects names longer than 120 characters", () => {
    const input = {
      name: "A".repeat(121),
      phone: "(11) 98765-4321",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid DDDs (e.g., 00 or 05)", () => {
    const input = {
      name: "Cliente Inválido",
      phone: "(00) 98765-4321",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("WhatsApp válido");
    }
  });

  it("rejects incomplete phone numbers", () => {
    const input = {
      name: "Cliente Incompleto",
      phone: "119876",
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects notes exceeding 500 characters", () => {
    const input = {
      name: "Cliente Observador",
      phone: "(11) 98765-4321",
      notes: "X".repeat(501),
    };
    const result = checkoutSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Máximo 500 caracteres");
    }
  });
});
