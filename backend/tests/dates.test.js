import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { currentMonth, today, monthRange, parseDay, isValidMonth, lastMonths } from '../src/utils/dates.js';

describe('Fechas y zonas horarias (Day.js)', () => {
  test('A las 23:30 del 30/11 en Lima (04:30 UTC del 01/12) el mes actual sigue siendo noviembre', () => {
    const instant = new Date('2026-12-01T04:30:00Z');
    assert.equal(currentMonth(instant, 'America/Lima'), '2026-11');
    assert.equal(today(instant, 'America/Lima'), '2026-11-30');
    assert.equal(currentMonth(instant, 'UTC'), '2026-12');
  });

  test('El mes contable va del primer al último milisegundo en UTC (incluye febrero)', () => {
    const { start, end } = monthRange('2026-02');
    assert.equal(start.toISOString(), '2026-02-01T00:00:00.000Z');
    assert.equal(end.toISOString(), '2026-02-28T23:59:59.999Z');
  });

  test('Validación estricta de días y meses', () => {
    assert.equal(parseDay('2026-11-31'), null);
    assert.equal(parseDay('30/11/2026'), null);
    assert.equal(parseDay('2026-11-30').toISOString(), '2026-11-30T00:00:00.000Z');
    assert.equal(isValidMonth('2026-13'), false);
    assert.deepEqual(lastMonths('2026-01', 3), ['2025-11', '2025-12', '2026-01']);
  });
});
