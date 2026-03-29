/**
 * Auto-generate weighted formula based on pillar and dimension weights
 * According to academic paper specifications
 */
export function generateWeightedFormula(
  pillars: Array<{ id: string; name: string; weight: number }>,
  dimensions: Array<{ id: string; name: string; weight: number }>
): {
  expression: string;
  description: string;
  type: 'weighted_average' | 'custom';
} {
  // Validate weights sum to 100
  const pillarWeightSum = pillars.reduce((sum, p) => sum + p.weight, 0);

  if (Math.abs(pillarWeightSum - 100) > 0.01 && pillarWeightSum > 0) {
    throw new Error(`Pillar weights must sum to 100%. Current sum: ${pillarWeightSum.toFixed(2)}%`);
  }

  if (pillars.length === 0) {
    throw new Error('At least one pillar with weight is required');
  }

  // Generate pillar-based formula: (P1 * w1 + P2 * w2 + ...) / 100
  const pillarTerms = pillars
    .filter(p => p.weight > 0)
    .map((p) => `(P_${p.id.slice(-4)} * ${p.weight / 100})`)
    .join(' + ');

  let formulaExpression = `(${pillarTerms})`;

  // Optional: Add dimension weighting if provided
  if (dimensions.length > 0) {
    const dimensionWeightSum = dimensions.reduce((sum, d) => sum + d.weight, 0);
    if (Math.abs(dimensionWeightSum - 100) < 0.01 && dimensionWeightSum > 0) {
      const dimensionTerms = dimensions
        .filter(d => d.weight > 0)
        .map((d) => `(D_${d.id.slice(-4)} * ${d.weight / 100})`)
        .join(' + ');
      // Combine: 60% from pillars, 40% from dimensions
      formulaExpression = `((${pillarTerms}) * 0.6) + ((${dimensionTerms}) * 0.4)`;
    }
  }

  return {
    expression: formulaExpression,
    description: `Weighted formula: ${pillars
      .filter(p => p.weight > 0)
      .map((p) => `${p.name} (${p.weight}%)`)
      .join(', ')}`,
    type: 'weighted_average',
  };
}

/**
 * Safely evaluate formula with actual scores
 */
export function evaluateFormula(
  formula: string,
  pillarScores: Record<string, number>,
  dimensionScores: Record<string, number> = {}
): number {
  try {
    let expression = formula;

    // Replace pillar placeholders with actual scores
    Object.entries(pillarScores).forEach(([id, score]) => {
      const lastFour = id.length > 4 ? id.slice(-4) : id;
      expression = expression.replace(new RegExp(`P_${lastFour}`, 'g'), `${Math.max(0, Math.min(5, score))}`);
    });

    // Replace dimension placeholders with actual scores
    Object.entries(dimensionScores).forEach(([id, score]) => {
      const lastFour = id.length > 4 ? id.slice(-4) : id;
      expression = expression.replace(new RegExp(`D_${lastFour}`, 'g'), `${Math.max(0, Math.min(5, score))}`);
    });

    // Safely evaluate using Function constructor
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    
    // Ensure result is between 0-5
    return Math.max(0, Math.min(5, parseFloat(result)));
  } catch (error) {
    console.error('Formula evaluation error:', error);
    throw new Error(`Invalid formula: ${formula}`);
  }
}

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    // Check for suspicious characters
    if (!/^[\d\s+\-*/()P_D.]+$/.test(formula)) {
      return { valid: false, error: 'Formula contains invalid characters' };
    }

    // Try to evaluate with dummy values
    const dummyExpression = formula
      .replace(/P_\w+/g, '2.5')
      .replace(/D_\w+/g, '2.5');

    // eslint-disable-next-line no-new-func
    new Function(`return ${dummyExpression}`)();
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid formula expression'
    };
  }
}

/**
 * Validate weight distribution
 */
export function validateWeights(weights: Record<string, number>, maxTotal: number = 100): {
  valid: boolean;
  error?: string;
  total: number;
} {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const tolerance = 0.01;

  if (Math.abs(total - maxTotal) > tolerance) {
    return {
      valid: false,
      error: `Weights must sum to ${maxTotal}%. Current sum: ${total.toFixed(2)}%`,
      total,
    };
  }

  return { valid: true, total };
}
