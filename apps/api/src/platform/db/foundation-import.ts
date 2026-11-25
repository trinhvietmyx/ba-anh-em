function record(
  value: unknown,
  path: string,
  keys: string[],
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} phải là object.`);
  }
  const result = value as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (!keys.includes(key))
      throw new Error(`${path}.${key} không được khai báo.`);
  }
  return result;
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path} phải là chuỗi có nội dung.`);
  }
  if (value.includes('\0')) {
    throw new Error(`${path} không được chứa ký tự NUL.`);
  }
  return value.trim();
}

function integer(value: unknown, path: string, minimum: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > 2147483647
  ) {
    throw new Error(`${path} phải là số nguyên từ ${minimum} đến 2147483647.`);
  }
  return value;
}

function entries(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} phải là danh sách.`);
  return value;
}

function uniqueCode(code: string, seen: Set<string>, path: string): string {
  if (seen.has(code)) throw new Error(`${path} trùng mã.`);
  seen.add(code);
  return code;
}

export function validateFoundationImport(value: unknown) {
  const layout = record(value, 'layout', [
    'source',
    'venue',
    'areas',
    'tables',
  ]);
  const source = text(layout.source, 'source');
  const venue = record(layout.venue, 'venue', ['code', 'name', 'timeZone']);
  const timeZone = text(venue.timeZone, 'venue.timeZone');
  try {
    if (/^[+-]/.test(timeZone)) throw new Error();
    new Intl.DateTimeFormat('vi-VN', { timeZone });
  } catch {
    throw new Error('venue.timeZone phải là múi giờ IANA hợp lệ.');
  }

  const areaCodes = new Set<string>();
  const areas = entries(layout.areas, 'areas').map((entry, index) => {
    const path = `areas[${index}]`;
    const area = record(entry, path, ['code', 'name', 'displayOrder']);
    return {
      code: uniqueCode(
        text(area.code, `${path}.code`),
        areaCodes,
        `${path}.code`,
      ),
      name: text(area.name, `${path}.name`),
      displayOrder: integer(
        area.displayOrder,
        `${path}.displayOrder`,
        -2147483648,
      ),
    };
  });

  const tableCodes = new Set<string>();
  const tables = entries(layout.tables, 'tables').map((entry, index) => {
    const path = `tables[${index}]`;
    const table = record(entry, path, ['code', 'areaCode', 'seats']);
    const areaCode = text(table.areaCode, `${path}.areaCode`);
    if (!areaCodes.has(areaCode))
      throw new Error(`${path}.areaCode chưa có trong areas.`);
    return {
      code: uniqueCode(
        text(table.code, `${path}.code`),
        tableCodes,
        `${path}.code`,
      ),
      areaCode,
      seats: integer(table.seats, `${path}.seats`, 1),
    };
  });

  return {
    source,
    venue: {
      code: text(venue.code, 'venue.code'),
      name: text(venue.name, 'venue.name'),
      timeZone,
    },
    areas,
    tables,
  };
}
