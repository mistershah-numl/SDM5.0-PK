# Weight System & Calculation Documentation

## Overview
The SDM 5.0 Assessment uses a **weighted hierarchical scoring system** with 4 levels:
1. **Question Level** (0-5)
2. **Dimension Level** (weighted average of questions)
3. **Pillar Level** (weighted average of dimensions)
4. **Overall Level** (weighted average of pillars)

## Detailed Calculation Flow

### Level 1: Question Scores
- **Direct user response**: Score 0-5
- **Source**: User selects answer in survey form
- **Weight Factor**: Question.weight (1-100)
- **Formula**: No calculation, just the raw response value

### Level 2: Dimension Scores
```
Dimension Score = (Σ(Question Score × Question Weight)) / Σ(Question Weights)
```

**Example:**
```
Dimension: "Digital Governance"
Questions:
  - Q1: Score=4, Weight=1 → 4×1=4
  - Q2: Score=3, Weight=2 → 3×2=6
  - Q3: Score=5, Weight=1 → 5×1=5

Dimension Score = (4+6+5) / (1+2+1) = 15/4 = 3.75
```

**Does Dimension Weight Affect Answers?** ✅ YES - It affects the calculation AFTER all dimensions are scored.

### Level 3: Pillar Scores  
```
Pillar Score = (Σ(Dimension Score × Dimension Weight)) / Σ(Dimension Weights)
```

**Example:**
```
Pillar: "Digital Strategy"
Dimensions:
  - D1 (Governance): Score=3.75, Weight=30 → 3.75×30=112.5
  - D2 (Vision): Score=4.0, Weight=40 → 4.0×40=160
  - D3 (Roadmap): Score=3.2, Weight=30 → 3.2×30=96

Pillar Score = (112.5+160+96) / (30+40+30) = 368.5/100 = 3.685
```

**Dimension Weight Impact**: ✅ YES - Dimension weights determine how much each dimension contributes to the pillar score

### Level 4: Overall Score
```
Overall Score = (Σ(Pillar Score × Pillar Weight)) / Σ(Pillar Weights)
```

**Example:**
```
IndexVersion: "SDM 5.0 2025"
Pillars:
  - P1 (Strategy): Score=3.685, Weight=25 → 3.685×25=92.125
  - P2 (Governance): Score=3.45, Weight=25 → 3.45×25=86.25
  - P3 (Tech): Score=3.9, Weight=25 → 3.9×25=97.5
  - P4 (Process): Score=3.6, Weight=25 → 3.6×25=90

Overall Score = (92.125+86.25+97.5+90) / (25+25+25+25) = 365.875/100 = 3.659
```

## Weight Hierarchy Summary

| Level | Weight Field | Affects | Used In |
|-------|--------------|---------|---------|
| Question | question.weight | Dimension score calculation | Dimension avg |
| Dimension | dimension.weight | Pillar score calculation | Pillar avg |
| **DIM Weight!** | **dimension.weight** | **❗ANSWER IMPACT** | **PILLAR CALC** |
| Pillar | pillar.weight | Overall score calculation | Overall avg |

## Where Weights Are Stored

1. **Question Weights** → `Question.weight` (MongoDB)
2. **Dimension Weights** → `Dimension.weight` (MongoDB) - ✅ **AFFECTS CALCULATIONS**
3. **Pillar Weights** → `Pillar.weight` (MongoDB)
4. **Formula-based Weights** → `Formula.pillarWeights` (MongoDB)

## Verification: Does Dimension Weight Affect Answer?

### YES! Dimension weights directly impact your final score:

**Scenario A:** Same answers, but different dimension weights
```
Questions in Dimension: Both answered as 4.0

Setup 1: Lower dimension weight (10%)
  Dimension Score = 4.0
  Pillar Contribution = 4.0 × 10% = 0.4

Setup 2: Higher dimension weight (40%)
  Dimension Score = 4.0 (same)
  Pillar Contribution = 4.0 × 40% = 1.6
  
RESULT: Same answers → Different pillar scores!
```

## AI Feedback Integration

When survey is submitted:
1. ✅ Questions with answers are sent to XAI Grok API
2. ✅ Pillar scores and dimension scores included
3. ✅ AI generates dimensional insights based on actual responses
4. ✅ Feedback provided with:
   - Overall feedback
   - Dimensional insights
   - Key observations
   - Immediate actions
   - Score justification

## Files Involved

### Backend Calculation
- `lib/scoring-engine.ts` - Main calculation logic
  - `calculateScores()` - Implements 4-level hierarchy
  - Uses question, dimension, pillar weights from MongoDB

### API Endpoints
- `app/api/surveys/submit` - Receives questions + answers
- `app/api/ai/feedback` - Generates XAI feedback
- `app/api/surveys/export-excel` - Excel generation with calculations

### Frontend
- `app/survey/page.tsx` - Survey form with submission
- Passes questions array with submission
- Displays AI feedback
- Excel export button

## Excel Report

When exporting as Excel:
1. **Sheet 1: Summary** - Overview with all scores
2. **Sheet 2: Detailed Breakdown** - Full hierarchy with weights
3. **Sheet 3: Calculation Logic** - Explains methodology with examples

## API Request/Response Examples

### Survey Submission (includes questions for AI)
```json
{
  "indexVersionId": "xxx",
  "responses": { "q1": 4, "q2": 3, "q3": 5 },
  "questions": [
    { "_id": "q1", "text": "...", "weight": 1, "dimensionName": "..." },
    { "_id": "q2", "text": "...", "weight": 2, "dimensionName": "..." }
  ],
  "pillarScores": [...],
  "dimensionScores": [...]
}
```

### AI Feedback Response
```json
{
  "feedback": {
    "overallFeedback": "...",
    "dimensionalInsights": { "Pillar Name": { "Dimension": "..." } },
    "keyObservations": ["...", "..."],
    "immediateActions": ["...", "...", "..."],
    "scoreJustification": "..."
  }
}
```

## Testing Recommendations

### Manual Calculation Verification
Use the Excel export to verify:
1. Compare displayed scores vs manual calculation
2. Check weight coefficients
3. Verify formula application at each level

### Test Scenarios
1. **All answers = 3.0** → All scores should be 3.0
2. **Varied answers** → Different pillar/dimension weights → Different results
3. **Dimension weight change** → Same answers → Same dimension score, different pillar score

## Common Questions

**Q: If I answer 4 for all questions, will all scores be 4?**
A: Yes, if all dimension/pillar weights are equal (or any proportion that sums to 100%).

**Q: Can dimension weights be 0?**
A: Technically yes, but not recommended. A dimension with weight 0 won't contribute to pillar score.

**Q: What if weights don't sum to 100%?**
A: The system normalizes by dividing by total weight. E.g., weights [30, 20, 50] auto-normalize.

**Q: Does question weight affect other answers?**
A: No. It only affects that dimension's weighted average calculation.

**Q: Can I use formulas instead of weights?**
A: Yes! Use custom formulas in Formula creation with syntax: `(P_PillarName*0.3)+(P_PillarName2*0.7)`
