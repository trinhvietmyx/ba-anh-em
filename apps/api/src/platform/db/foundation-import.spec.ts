import { validateFoundationImport } from './foundation-import';

const layout = {
  source: 'Bố trí mẫu',
  venue: { code: 'BAE', name: 'Ba Anh Em', timeZone: 'Asia/Ho_Chi_Minh' },
  areas: [{ code: 'A', name: 'Sảnh', displayOrder: 0 }],
  tables: [{ code: 'A01', areaCode: 'A', seats: 4 }],
};

describe('validateFoundationImport', () => {
  it('validates a sourced layout and trims identifiers', () => {
    const data = { ...layout, venue: { ...layout.venue, code: ' BAE ' } };
    expect(validateFoundationImport(data)).toEqual(layout);
  });

  it('rejects missing source and undeclared fields', () => {
    expect(() => validateFoundationImport({ ...layout, source: ' ' })).toThrow(
      'source',
    );
    expect(() => validateFoundationImport({ ...layout, extra: true })).toThrow(
      'extra',
    );
  });

  it('rejects duplicate and missing layout references', () => {
    expect(() =>
      validateFoundationImport({
        ...layout,
        tables: [...layout.tables, { code: ' A01 ', areaCode: 'A', seats: 2 }],
      }),
    ).toThrow('tables[1].code');
    expect(() =>
      validateFoundationImport({
        ...layout,
        tables: [{ code: 'A01', areaCode: 'missing', seats: 4 }],
      }),
    ).toThrow('tables[0].areaCode');
  });

  it('rejects an invalid capacity or time zone', () => {
    expect(() =>
      validateFoundationImport({
        ...layout,
        tables: [{ ...layout.tables[0], seats: 0 }],
      }),
    ).toThrow('tables[0].seats');
    expect(() =>
      validateFoundationImport({
        ...layout,
        venue: { ...layout.venue, timeZone: 'invalid' },
      }),
    ).toThrow('venue.timeZone');
  });

  it('rejects text that PostgreSQL cannot store', () => {
    expect(() =>
      validateFoundationImport({
        ...layout,
        venue: { ...layout.venue, name: 'Ba\0Anh Em' },
      }),
    ).toThrow('venue.name');
  });
});
