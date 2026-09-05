import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PlusSignIcon,
  Delete02Icon,
  ColorPickerIcon,
  RulerIcon,
  AiMagicIcon,
  Settings01Icon,
  ToggleOnIcon,
  ToggleOffIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { VariationType, VariationOption } from "@/types/domain";
import {
  generateCartesianVariants,
  inferAxesFromExisting,
  type VariationAxisInput,
} from "../utils/variation";

type SharedProps = {
  productName?: string;
  productStock?: number | null;
  productPriceInCents?: number | null;
  initialType?: VariationType | null;
  initialLabel?: string | null;
  initialOptions?: VariationOption[] | null;
  onSave: (
    type: VariationType,
    label: string,
    options: VariationOption[],
  ) => void;
  onClose: () => void;
};

type Props = SharedProps & { open: boolean };

const COLOR_PRESETS = [
  "Preto",
  "Branco",
  "Cinza",
  "Amarelo",
  "Vermelho",
  "Verde",
  "Azul",
  "Roxo",
  "Rosa",
];

const SIZE_PRESETS = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "36",
  "38",
  "40",
  "42",
  "44",
];

const MATERIAL_PRESETS = [
  "Algodão",
  "Linho",
  "Couro",
  "Poliéster",
  "Jeans",
  "Seda",
];

const VOLTAGE_PRESETS = ["110V", "220V", "Bivolt"];

const CUSTOM_PRESETS = [
  "Com personalização",
  "Sem personalização",
  "Com nome e número",
  "Com gravação",
  "Sem gravação",
  "Com foto",
];

function getPresetsForAxis(name: string): string[] {
  const lower = name.toLowerCase().trim();
  if (lower.includes("cor") || lower.includes("color")) return COLOR_PRESETS;
  if (lower.includes("tam") || lower.includes("size")) return SIZE_PRESETS;
  if (lower.includes("person") || lower.includes("custom")) return CUSTOM_PRESETS;
  if (lower.includes("mat") || lower.includes("tecido")) return MATERIAL_PRESETS;
  if (lower.includes("volt")) return VOLTAGE_PRESETS;
  return [];
}

const AXIS_SUGGESTIONS = [
  { label: "Cor", icon: ColorPickerIcon },
  { label: "Tamanho", icon: RulerIcon },
  { label: "Personalizado", icon: AiMagicIcon },
  { label: "Material", icon: Settings01Icon },
  { label: "Voltagem", icon: Settings01Icon },
  { label: "Modelo", icon: Settings01Icon },
];

export function ProductVariationModal({ open, ...rest }: Props) {
  if (!open) return null;
  return (
    <ModalContent
      key={`variation-modal-${rest.initialType ?? ""}-${rest.initialLabel ?? ""}-${(rest.initialOptions ?? []).length}`}
      {...rest}
    />
  );
}

function ModalContent({
  productStock,
  productPriceInCents,
  initialType,
  initialLabel,
  initialOptions,
  onSave,
  onClose,
}: SharedProps) {
  // Initialize axes from existing options or default to 1 axis (Cor)
  const initialAxes = useMemo(() => {
    return inferAxesFromExisting(initialType, initialLabel, initialOptions);
  }, [initialType, initialLabel, initialOptions]);

  const [axes, setAxes] = useState<VariationAxisInput[]>(initialAxes);
  const [axisInputs, setAxisInputs] = useState<Record<number, string>>({});

  // Variants state initialized from initialOptions or generated from initialAxes
  const [variants, setVariants] = useState<VariationOption[]>(() => {
    if (initialOptions && initialOptions.length > 0) {
      return initialOptions;
    }
    return generateCartesianVariants(
      initialAxes,
      null,
      productPriceInCents ?? undefined,
      productStock ?? null,
    );
  });

  // Bulk actions state
  const [bulkStock, setBulkStock] = useState<string>("");
  const [bulkPrice, setBulkPrice] = useState<string>("");

  // Sync variants when axes change, preserving existing edits
  const syncVariantsWithAxes = (nextAxes: VariationAxisInput[]) => {
    setAxes(nextAxes);
    const updated = generateCartesianVariants(
      nextAxes,
      variants,
      productPriceInCents ?? undefined,
      productStock ?? null,
    );
    setVariants(updated);
  };

  // Axis management
  const addAxis = (suggestedName?: string) => {
    if (axes.length >= 3) return;
    const available = AXIS_SUGGESTIONS.find(
      (s) => !axes.some((a) => a.name.toLowerCase() === s.label.toLowerCase()),
    );
    const newName =
      suggestedName || (available ? available.label : `Eixo ${axes.length + 1}`);
    const nextAxes = [...axes, { name: newName, values: [] }];
    syncVariantsWithAxes(nextAxes);
  };

  const removeAxis = (index: number) => {
    if (axes.length <= 1) return;
    const nextAxes = axes.filter((_, i) => i !== index);
    syncVariantsWithAxes(nextAxes);
  };

  const updateAxisName = (index: number, name: string) => {
    const nextAxes = axes.map((a, i) => (i === index ? { ...a, name } : a));
    syncVariantsWithAxes(nextAxes);
  };

  const addAxisValue = (index: number, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const targetAxis = axes[index];
    if (
      targetAxis.values.some(
        (v) => v.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setAxisInputs((prev) => ({ ...prev, [index]: "" }));
      return;
    }

    const nextAxes = axes.map((a, i) =>
      i === index ? { ...a, values: [...a.values, trimmed] } : a,
    );
    setAxisInputs((prev) => ({ ...prev, [index]: "" }));
    syncVariantsWithAxes(nextAxes);
  };

  const removeAxisValue = (axisIndex: number, valueIndex: number) => {
    const nextAxes = axes.map((a, i) =>
      i === axisIndex
        ? { ...a, values: a.values.filter((_, vi) => vi !== valueIndex) }
        : a,
    );
    syncVariantsWithAxes(nextAxes);
  };

  // Variant editing
  const updateVariant = (index: number, patch: Partial<VariationOption>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  };

  // Bulk actions
  const applyBulkStock = () => {
    const parsed = bulkStock.trim() === "" ? null : parseInt(bulkStock, 10);
    if (parsed !== null && isNaN(parsed)) return;
    setVariants((prev) =>
      prev.map((v) => (v.is_active !== false ? { ...v, stock: parsed } : v)),
    );
    setBulkStock("");
  };

  const applyBulkPrice = () => {
    const parsed =
      bulkPrice.trim() === ""
        ? null
        : Math.round(parseFloat(bulkPrice.replace(",", ".")) * 100);
    if (parsed !== null && isNaN(parsed)) return;
    setVariants((prev) =>
      prev.map((v) =>
        v.is_active !== false ? { ...v, price_in_cents: parsed } : v,
      ),
    );
    setBulkPrice("");
  };

  const setAllActive = (active: boolean) => {
    setVariants((prev) => prev.map((v) => ({ ...v, is_active: active })));
  };

  // Save handler
  const handleSave = () => {
    const primaryAxis = axes[0];
    const primaryName = primaryAxis?.name?.trim() || "Opções";
    let primaryType: VariationType = "other";
    if (primaryName.toLowerCase().includes("cor")) {
      primaryType = "color";
    } else if (primaryName.toLowerCase().includes("tam")) {
      primaryType = "size";
    }

    // Filter out variants that were disabled or have empty names
    onSave(primaryType, primaryName, variants);
    onClose();
  };

  const activeCount = variants.filter((v) => v.is_active !== false).length;
  const canSave = activeCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-z-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-z-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-z-text">
              Variações do Produto
            </h2>
            <p className="text-xs text-z-text-muted">
              Configure até 3 eixos (ex: Cor, Tamanho, Material) e ajuste estoque e preço por combinação.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Eixos e Valores */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-z-text-hint">
                1. Eixos de variação ({axes.length}/3)
              </span>
              {axes.length < 3 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-z-text-hint mr-1">
                    Adicionar eixo:
                  </span>
                  {AXIS_SUGGESTIONS.filter(
                    (s) =>
                      !axes.some(
                        (a) => a.name.toLowerCase() === s.label.toLowerCase(),
                      ),
                  )
                    .slice(0, 3)
                    .map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => addAxis(s.label)}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-z-border bg-white px-2 py-1 text-xs font-medium text-z-text hover:border-z-green hover:text-[#10b981] transition-colors"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={12} />
                        {s.label}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => addAxis()}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-z-border bg-white px-2 py-1 text-xs font-medium text-z-text hover:border-z-green hover:text-[#10b981] transition-colors"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={12} />
                    Outro eixo
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {axes.map((axis, axisIdx) => {
                const presets = getPresetsForAxis(axis.name);

                return (
                  <div
                    key={axisIdx}
                    className="rounded-xl border border-z-border bg-z-bg/50 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-z-text-hint block mb-1">
                          Nome do eixo {axisIdx + 1}
                        </label>
                        <input
                          type="text"
                          value={axis.name}
                          onChange={(e) =>
                            updateAxisName(axisIdx, e.target.value)
                          }
                          placeholder="Ex: Cor, Tamanho, Material..."
                          className="h-9 w-full max-w-xs rounded-lg border border-z-border bg-white px-3 text-sm font-medium placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        />
                      </div>

                      {axes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAxis(axisIdx)}
                          className="self-end mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-z-text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Remover eixo"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} />
                        </button>
                      )}
                    </div>

                    {/* Quick name suggestions if axis is still empty */}
                    {axis.values.length === 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-medium text-z-text-hint">
                          Sugestões:
                        </span>
                        {AXIS_SUGGESTIONS.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => updateAxisName(axisIdx, s.label)}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                              axis.name.toLowerCase() === s.label.toLowerCase()
                                ? "border-z-green bg-z-green/10 text-[#10b981] font-semibold"
                                : "border-z-border bg-white text-z-text hover:border-z-text",
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Presets if applicable */}
                    {presets.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-z-text-hint">
                          Atalhos:
                        </span>
                        {presets.map((preset) => {
                          const hasPreset = axis.values.some(
                            (v) => v.toLowerCase() === preset.toLowerCase(),
                          );
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => addAxisValue(axisIdx, preset)}
                              disabled={hasPreset}
                              className={cn(
                                "rounded-md border border-z-border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                hasPreset
                                  ? "bg-z-bg text-z-text-hint cursor-default opacity-50"
                                  : "bg-white text-z-text hover:border-z-green hover:text-[#10b981]",
                              )}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Input to add value */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={axisInputs[axisIdx] ?? ""}
                        onChange={(e) =>
                          setAxisInputs((prev) => ({
                            ...prev,
                            [axisIdx]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAxisValue(axisIdx, axisInputs[axisIdx] ?? "");
                          }
                        }}
                        placeholder={`Digite um valor para ${axis.name || "o eixo"} e aperte Enter`}
                        className="h-9 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          addAxisValue(axisIdx, axisInputs[axisIdx] ?? "")
                        }
                        className="h-9 rounded-lg border border-z-border bg-white px-3 text-xs font-medium text-z-text hover:border-z-green hover:text-[#10b981] transition-colors shrink-0"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {/* Value chips */}
                    {axis.values.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {axis.values.map((val, valIdx) => (
                          <span
                            key={valIdx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-z-border bg-white px-2.5 py-1 text-xs font-medium text-z-text shadow-sm"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeAxisValue(axisIdx, valIdx)}
                              className="text-z-text-hint hover:text-rose-600 transition-colors"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Matriz de Combinações */}
          {variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-z-border pt-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-z-text-hint">
                    2. Combinações geradas ({activeCount} ativas de{" "}
                    {variants.length})
                  </span>
                  <p className="text-xs text-z-text-muted mt-0.5">
                    Desative combinações que sua loja não vende (matriz esparsa)
                    e defina estoque ou preço específico.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllActive(true)}
                    className="text-xs font-medium text-[#10b981] hover:underline"
                  >
                    Ativar todas
                  </button>
                  <span className="text-z-text-hint">·</span>
                  <button
                    type="button"
                    onClick={() => setAllActive(false)}
                    className="text-xs font-medium text-z-text-muted hover:text-rose-600 hover:underline"
                  >
                    Desativar todas
                  </button>
                </div>
              </div>

              {/* Bulk Toolbar */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-z-border bg-z-bg p-3">
                <span className="text-xs font-semibold text-z-text-hint">
                  Ações em massa:
                </span>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    placeholder="Estoque padrão"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="h-8 w-28 rounded-lg border border-z-border bg-white px-2.5 text-xs placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyBulkStock}
                    className="h-8 rounded-lg border border-z-border bg-white px-2 text-xs font-medium text-z-text hover:border-z-green hover:text-[#10b981]"
                  >
                    Aplicar
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Preço (R$)"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="h-8 w-28 rounded-lg border border-z-border bg-white px-2.5 text-xs placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyBulkPrice}
                    className="h-8 rounded-lg border border-z-border bg-white px-2 text-xs font-medium text-z-text hover:border-z-green hover:text-[#10b981]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-z-border bg-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-z-border bg-z-bg text-[11px] font-bold uppercase tracking-wider text-z-text-hint">
                      <th className="py-2.5 pl-4 pr-2 w-12 text-center">Ativo</th>
                      <th className="py-2.5 px-3">Combinação</th>
                      <th className="py-2.5 px-3 w-32">Estoque</th>
                      <th className="py-2.5 px-3 w-36">Preço (R$)</th>
                      <th className="py-2.5 px-3 pr-4 w-36">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-z-border">
                    {variants.map((v, i) => {
                      const isActive = v.is_active !== false;
                      const hasCustomPrice = v.price_in_cents != null;

                      return (
                        <tr
                          key={i}
                          className={cn(
                            "transition-colors",
                            !isActive ? "bg-z-bg/60 opacity-60" : "hover:bg-z-bg/30",
                          )}
                        >
                          <td className="py-2.5 pl-4 pr-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                updateVariant(i, { is_active: !isActive })
                              }
                              className="text-z-text-muted hover:text-z-text transition-colors inline-flex"
                              title={
                                isActive
                                  ? "Clique para desativar"
                                  : "Clique para ativar"
                              }
                            >
                              <HugeiconsIcon
                                icon={isActive ? ToggleOnIcon : ToggleOffIcon}
                                size={22}
                                className={isActive ? "text-[#10b981]" : "text-z-text-hint"}
                              />
                            </button>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-z-text block">
                              {v.name}
                            </span>
                            {v.attributes && Object.keys(v.attributes).length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(v.attributes).map(
                                  ([k, val]) => (
                                    <span
                                      key={k}
                                      className="rounded bg-z-bg px-1.5 py-0.5 text-[10px] text-z-text-muted border border-z-border/50"
                                    >
                                      {k}: <strong className="text-z-text">{val}</strong>
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              disabled={!isActive}
                              placeholder="Ilimitado"
                              value={v.stock ?? ""}
                              onChange={(e) =>
                                updateVariant(i, {
                                  stock:
                                    e.target.value === ""
                                      ? null
                                      : parseInt(e.target.value, 10),
                                })
                              }
                              className="h-8 w-full rounded-lg border border-z-border px-2.5 text-xs placeholder:text-z-text-hint focus:border-z-green focus:outline-none disabled:bg-z-bg disabled:text-z-text-hint"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                disabled={!isActive}
                                placeholder={
                                  productPriceInCents != null
                                    ? (productPriceInCents / 100).toFixed(2)
                                    : "Padrão"
                                }
                                value={
                                  v.price_in_cents != null
                                    ? (v.price_in_cents / 100).toString()
                                    : ""
                                }
                                onChange={(e) =>
                                  updateVariant(i, {
                                    price_in_cents:
                                      e.target.value === ""
                                        ? null
                                        : Math.round(
                                            parseFloat(e.target.value) * 100,
                                          ),
                                  })
                                }
                                className={cn(
                                  "h-8 w-full rounded-lg border px-2.5 text-xs placeholder:text-z-text-hint focus:border-z-green focus:outline-none disabled:bg-z-bg disabled:text-z-text-hint",
                                  hasCustomPrice
                                    ? "border-violet-300 font-medium text-violet-700 bg-violet-50/20"
                                    : "border-z-border",
                                )}
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-3 pr-4">
                            <input
                              type="text"
                              disabled={!isActive}
                              placeholder="Ex: SKU-123"
                              value={v.sku ?? ""}
                              onChange={(e) =>
                                updateVariant(i, {
                                  sku: e.target.value.trim() || null,
                                })
                              }
                              className="h-8 w-full rounded-lg border border-z-border px-2.5 text-xs placeholder:text-z-text-hint focus:border-z-green focus:outline-none disabled:bg-z-bg disabled:text-z-text-hint"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-z-border px-6 py-4 bg-white">
          <span className="text-xs text-z-text-muted">
            {activeCount > 0
              ? `${activeCount} variação(ões) pronta(s) para venda.`
              : "Nenhuma variação ativa selecionada."}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-z-border px-4 py-2 text-sm font-medium text-z-text-muted transition-colors hover:bg-z-bg2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="rounded-[10px] bg-violet-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar variações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
