// src/modules/quotes/domain/pricing/strategies/wardrobe-pricing.strategy.ts

import { Injectable, Logger } from "@nestjs/common";
import { PricingStrategy } from "../pricing-strategy.interface";
import { AnyQuoteRequestDto } from "src/modules/quotes/application/dto/base-quote-request.dto";
import { CalculatorType } from "../../enums/calculator-type.enum";
import { ConfigService } from "@nestjs/config";

// Note: Ensure this DTO matches the exact path in your project
import { CreateWardrobeQuoteDto } from "src/modules/quotes/application/dto/request/create-wardrobe-quote.dto";

@Injectable()
export class WardrobePricingStrategy implements PricingStrategy {
  private readonly logger = new Logger(WardrobePricingStrategy.name);

  readonly pricingVersion: string;

  /**
   * 🎛️ PRICING CATALOG (Plug & Play)
   * Keys must be lowercase for case-insensitive matching.
   */
  private readonly PRICING = {
    // Cost per Square Foot (Sq.Ft)
    coreCostPerSqft: {
      mdf: 80,
      hdhmr: 120,
      plywood: 160,
    } as Record<string, number>,

    // Cost per Square Foot (Sq.Ft)
    finishCostPerSqft: {
      laminate: 100,
      acrylic: 250,
      veneer: 300,
      "pu paint": 350,
      glass: 400,
    } as Record<string, number>,

    // Hardware & Mechanism Cost per Square Foot (Sq.Ft)
    typeHardwareCostPerSqft: {
      "hinged door": 50,
      "sliding door": 150,
      "walk-in": 0,
    } as Record<string, number>,

    // Flat Add-on Costs based on exact frontend accessory lists
    accessoryFlatCost: {
      drawers: 3500,
      "shoe rack": 2500,
      "jewellery organizer": 3000,
      mirror: 2000,
      "led lighting": 2500,
      "soft close hinges": 1500,
      "tie holder": 1000,
      "trouser pull-out": 3000,
    } as Record<string, number>,

    // Global Package Multipliers
    packageMultiplier: {
      essential: 1.0,
      standard: 1.15,
      premium: 1.3,
      luxury: 1.5,
    } as Record<string, number>,
  };

  constructor(private readonly config: ConfigService) {
    this.pricingVersion =
      this.config.get<string>("WARDROBE_PRICING_VERSION") || "wardrobe-v1";
  }

  supports(type: CalculatorType): boolean {
    return type === CalculatorType.WARDROBE;
  }

  calculateEstimate(quoteRequest: AnyQuoteRequestDto): number {
    const dto = quoteRequest as CreateWardrobeQuoteDto;
    const {
      configuration: {
        dimensions,
        length,
        height,
        materials,
        wardrobeType,
        accessories,
        package: packageName,
      },
    } = dto;

    // 1. Bulletproof Area Calculation
    // Try the strict dimensions object first, fallback to parsing the strings if missing
    const widthFeet =
      dimensions?.widthFeet ?? this.parseFallbackDimension(length);
    const heightFeet =
      dimensions?.heightFeet ?? this.parseFallbackDimension(height);
    const areaSqft = widthFeet * heightFeet;

    if (areaSqft === 0) {
      this.logger.warn(
        `Wardrobe area calculated as 0. Dimensions missing or invalid.`,
      );
    }

    // 2. Fetch Rates with Safe Fallbacks
    // Fallbacks guarantee the server never crashes with NaN
    const coreRate = this.getSafeRate(
      this.PRICING.coreCostPerSqft,
      materials?.core,
      120,
    );
    const finishRate = this.getSafeRate(
      this.PRICING.finishCostPerSqft,
      materials?.finish,
      100,
    );
    const typeRate = this.getSafeRate(
      this.PRICING.typeHardwareCostPerSqft,
      wardrobeType,
      50,
    );

    // 3. Compute Base Structural Cost
    const totalRatePerSqft = coreRate + finishRate + typeRate;
    let baseTotal = areaSqft * totalRatePerSqft;

    // 4. Add Accessories Flat Costs
    if (Array.isArray(accessories) && accessories.length > 0) {
      const accessoriesTotal = accessories.reduce((sum, accessory) => {
        return (
          sum + this.getSafeRate(this.PRICING.accessoryFlatCost, accessory, 0)
        );
      }, 0);
      baseTotal += accessoriesTotal;
    }

    // 5. Apply Package Tier Multiplier (If provided)
    if (packageName) {
      const multiplier = this.getSafeRate(
        this.PRICING.packageMultiplier,
        packageName,
        1.0,
      );
      baseTotal *= multiplier;
    }

    // 6. Round and Return
    const finalEstimate = Math.round(baseTotal);

    this.logger.debug(
      `Calculated Wardrobe Estimate: ${areaSqft} sqft @ ₹${totalRatePerSqft}/sqft + Accessories = ₹${finalEstimate}`,
    );

    return finalEstimate;
  }

  getPricingSnapshot(): Record<string, unknown> {
    return {
      strategyVersion: this.pricingVersion,
      pricingData: structuredClone(this.PRICING),
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Safe Lookup Helper
   * - Ignores casing and spacing (e.g. " LED Lighting " matches "led lighting")
   */
  private getSafeRate(
    catalog: Record<string, number>,
    key: string | undefined,
    fallback: number,
  ): number {
    if (!key || typeof key !== "string") return fallback;
    const normalizedKey = key.trim().toLowerCase();
    return catalog[normalizedKey] !== undefined
      ? catalog[normalizedKey]
      : fallback;
  }

  /**
   * Defensive parser in case `dimensions` object is missing and we only have string values like "6" or "8ft"
   */
  private parseFallbackDimension(val: string | undefined): number {
    if (!val) return 0;
    const match = val.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
}
