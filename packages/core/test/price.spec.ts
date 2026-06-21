import { priceChangeType } from '../src/utils/price';

describe('priceChangeType', () => {
  it('records INITIAL for a brand-new property', () => {
    expect(priceChangeType(null, 500000, true)).toBe('INITIAL');
  });

  it('records INITIAL when an existing property gets its first known price', () => {
    expect(priceChangeType(null, 500000, false)).toBe('INITIAL');
  });

  it('detects an increase', () => {
    expect(priceChangeType(500000, 525000, false)).toBe('INCREASE');
  });

  it('detects a decrease', () => {
    expect(priceChangeType(525000, 499950, false)).toBe('DECREASE');
  });

  it('records nothing when the price is unchanged', () => {
    expect(priceChangeType(500000, 500000, false)).toBeNull();
  });

  it('records nothing when there is no new price (POA)', () => {
    expect(priceChangeType(500000, null, false)).toBeNull();
  });
});
