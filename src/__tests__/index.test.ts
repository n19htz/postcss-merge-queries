import fs from 'fs';
import path from 'path';
import postcss, { PluginCreator } from 'postcss';
import postcssMergeQueries from '../index';

const doNothing: PluginCreator<any> = () => ({ postcssPlugin: 'do-nothing' });
doNothing.postcss = true;

function pack(css: string, opts?: any) {
  return postcss([postcssMergeQueries(opts)]).process(css, opts);
}

describe('Public API', () => {
  const input = `.foo {
  z-index: 0;
}

@media (min-width:1px) {
  .foo {
    z-index: 1;
  }
}
`;
  const expected = postcss(doNothing).process(input).css;

  test('should not change css while processing via postcss', () => {
    expect(postcss([postcssMergeQueries()]).process(input).css).toEqual(expected);
  });
  test('should not change css while processed without postcss', () => {
    expect(pack(input).css).toEqual(expected);
  });
});

describe('Option: PostCSS options', () => {
  const input = `.foo {
  z-index: 0;
}

@media (min-width:1px) {
  .foo {
    z-index: 1;
  }
}

/*# sourceMappingURL=from.css.map */
`;
  const opts = {
    from: 'from.css',
    map: {
      inline: false,
    },
  };
  const expected = postcss(doNothing).process(input, opts);
  const processed = pack(input, opts);

  test('should match expected while processing with postcss options', () => {
    expect(processed.css).toEqual(expected.css);
    expect(processed.map).toEqual(expected.map);
  });
});

describe('Option: sort', () => {
  const expected = `.foo {
  z-index: 0;
}

@media (min-width: 1px) {
  .foo {
    z-index: 1;
  }
}

@media (min-width: 2px) {
  .foo {
    z-index: 2;
  }
}
`;
  const input = `.foo {
  z-index: 0;
}

@media (min-width: 2px) {
  .foo {
    z-index: 2;
  }
}

@media (min-width: 1px) {
  .foo {
    z-index: 1;
  }
}
`;
  const opts = {
    sort: true,
  };

  test('should not match expected if sort option set to false', () => {
    expect(pack(input).css).not.toEqual(expected);
  });

  test('should match expected if sort option set to true', () => {
    expect(pack(input, opts).css).toEqual(expected);
  });

  test('should not be the same output if processed via postcss with and without option set to true', () => {
    expect(postcss([postcssMergeQueries()]).process(input).css).not.toEqual(
      postcss([postcssMergeQueries(opts)]).process(input).css,
    );
  });

  test('should sort according to sort custom function provided', () => {
    expect(
      pack(input, {
        sort: (c: string, d: string) => c.localeCompare(d),
      }).css,
    ).toEqual(expected);
  });
});

describe('Real CSS', () => {
  const testCases = fs.readdirSync(path.join(__dirname, 'fixtures'));
  const readExpected = (file: string) =>
    fs.readFileSync(path.join(__dirname, 'expected', file), 'utf8');
  const readInput = (file: string) =>
    fs.readFileSync(path.join(__dirname, 'fixtures', file), 'utf8');
  testCases.forEach((testCase, index) => {
    const opts = {
      sort: false,
    };

    if (testCase.indexOf('sort_') === 0) {
      opts.sort = true;
    }
    test(`file number ${index + 1} from 'test/fixtures' should match snapshot number ${
      index + 1
    } of 'test/expected'`, () => {
      expect(pack(readInput(testCase), opts).css).toEqual(readExpected(testCase));
    });
  });
});
