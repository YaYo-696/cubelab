import { expect, it } from 'vitest';
import { translate } from '../../src/i18n/translate';
it('interpola los parámetros de una etapa en ambos idiomas', () => {
    expect(translate('es', 'pair', { pair: 2 })).toBe('Par 2');
    expect(translate('en', 'caseName', { caseName: 'Ua' })).toBe('Case Ua');
});
