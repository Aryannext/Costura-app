import { describe, it, expect } from 'vitest';
import { formatearMoneda } from '../formato.js';

describe('formatearMoneda', () => {
    it('agrupa los miles con punto y no muestra decimales', () => {
        expect(formatearMoneda(20000)).toBe('$20.000');
        expect(formatearMoneda(1500000)).toBe('$1.500.000');
        expect(formatearMoneda(12500.4)).toBe('$12.500');
    });

    it('también agrupa los números de cuatro cifras', () => {
        expect(formatearMoneda(1000)).toBe('$1.000');
    });

    it('cero, texto numérico y valores ausentes', () => {
        expect(formatearMoneda(0)).toBe('$0');
        expect(formatearMoneda('7000')).toBe('$7.000');
        expect(formatearMoneda(null)).toBe('$0');
        expect(formatearMoneda(undefined)).toBe('$0');
        expect(formatearMoneda('abc')).toBe('$0');
    });

    it('un saldo negativo heredado lleva el signo delante del símbolo', () => {
        expect(formatearMoneda(-40000)).toBe('-$40.000');
    });
});
