class DeliveryPricingEngine {
  constructor() {
    this.BASE_FARE = 300;
    this.PER_KM_RATE = 150;
    this.PER_MIN_RATE = 20;
    this.MIN_FEE = 500;
    this.MAX_FEE = 3000;
  }

  isPeakHour() {
    const now = new Date();
    const hour = now.getHours();
    // Peak hours: 12-2pm (12, 13) and 6-9pm (18, 19, 20)
    return (hour >= 12 && hour < 14) || (hour >= 18 && hour < 21);
  }

  getDemandMultiplier(vendorId, activeOrdersCount) {
    // Surge pricing based on active orders
    if (activeOrdersCount >= 50) return 1.5; // Very high demand
    if (activeOrdersCount >= 30) return 1.3; // High demand
    if (activeOrdersCount >= 20) return 1.15; // Medium-high demand
    if (activeOrdersCount >= 10) return 1.1; // Medium demand
    return 1.0; // Normal
  }

  calculateFee(distanceKm, estimatedMinutes, isPeakHour = null, demandMultiplier = 1.0) {
    // Use passed value or calculate
    const peakHour = isPeakHour !== null ? isPeakHour : this.isPeakHour();

    // Calculate base components
    const baseFare = this.BASE_FARE;
    const distanceFee = distanceKm * this.PER_KM_RATE;
    const timeFee = estimatedMinutes * this.PER_MIN_RATE;

    // Subtotal before multipliers
    let subtotal = baseFare + distanceFee + timeFee;

    // Apply peak hour multiplier (1.2x during peak hours)
    const peakMultiplier = peakHour ? 1.2 : 1.0;
    subtotal *= peakMultiplier;

    // Apply demand multiplier
    subtotal *= demandMultiplier;

    // Apply min/max bounds
    let fee = Math.max(this.MIN_FEE, Math.min(this.MAX_FEE, subtotal));

    // Round to nearest 50 for nice UX
    fee = Math.round(fee / 50) * 50;

    return {
      fee,
      breakdown: {
        baseFare,
        distanceFee: Math.round(distanceFee),
        timeFee,
        surgeMultiplier: demandMultiplier,
        peakMultiplier,
      },
    };
  }
}

module.exports = new DeliveryPricingEngine();
