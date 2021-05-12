import { AtRule, PluginCreator, ChildNode, list } from 'postcss';

type Queries = { [x: string]: AtRule };
type Expressions = { [x: string]: boolean | string[] };

const isSourceMapAnnotation = (rule?: ChildNode): boolean => {
  if (!rule) {
    return false;
  }

  if (rule.type !== 'comment') {
    return false;
  }

  if (rule.text.toLowerCase().indexOf('# sourcemappingurl=') !== 0) {
    return false;
  }

  return true;
};

const parseQueryList = (queryList: string) => {
  const queries: Expressions[] = [];

  list.comma(queryList).forEach(query => {
    const expressions: Expressions = {};

    list.space(query).forEach(expression => {
      let newExpression: string | string[] = expression.toLowerCase();

      if (newExpression === 'and') {
        return;
      }

      if (/^\w+$/.test(newExpression)) {
        expressions[newExpression] = true;

        return;
      }

      newExpression = list.split(newExpression.replace(/^\(|\)$/g, ''), [':'], false);
      const [feature, value] = newExpression;

      if (!expressions[feature]) {
        expressions[feature] = [];
      }

      (expressions[feature] as string[]).push(value);
    });
    queries.push(expressions);
  });

  return queries;
};

const inspectLength = (length: string | null) => {
  if (length === '0') {
    return 0;
  }

  const matches = /(-?\d*\.?\d+)(ch|em|ex|px|rem)/.exec(String(length));

  if (!matches) {
    return Number.MAX_VALUE;
  }

  matches.shift();
  const [num, unit] = matches;
  let newNum;

  switch (unit) {
    case 'ch':
      newNum = parseFloat(num) * 8.8984375;
      break;
    case 'em':
    case 'rem':
      newNum = parseFloat(num) * 16;
      break;
    case 'ex':
      newNum = parseFloat(num) * 8.296875;
      break;
    default:
      newNum = parseFloat(num);
      break;
  }

  return newNum;
};

const pickMinimumMinWidth = (expressions: Expressions[]) => {
  const minWidths: number[] = [];

  expressions.forEach(feature => {
    let minWidth: boolean | string[] | null[] = feature['min-width'];

    if (!minWidth || feature.not || feature.print) {
      minWidth = [null];
    }

    minWidths.push((minWidth as string[] | null[]).map(inspectLength).sort((a, b) => b - a)[0]);
  });

  return minWidths.sort((a, b) => a - b)[0];
};

const sortQueryLists = (
  queryLists: string[],
  sort?: ((a: string, b: string) => number) | boolean,
) => {
  const mapQueryLists: Expressions[][] = [];

  if (!sort) {
    return queryLists;
  }

  if (typeof sort === 'function') {
    return queryLists.sort(sort);
  }

  queryLists.forEach((queryList: string) => {
    mapQueryLists.push(parseQueryList(queryList));
  });

  return mapQueryLists
    .map((e, i) => ({
      index: i,
      value: pickMinimumMinWidth(e),
    }))
    .sort((a, b) => a.value - b.value)
    .map(e => queryLists[e.index]);
};

const postcssMergeQueries: PluginCreator<{
  sort: boolean | ((a: string, b: string) => number);
}> = options => {
  const opts = {
    sort: false,
    ...options,
  };

  return {
    postcssPlugin: 'postcss-merge-queries',
    prepare(result) {
      const queries: Queries = {};
      const queryLists: string[] = [];

      let sourceMap = result.root.last;

      if (!isSourceMapAnnotation(sourceMap)) {
        sourceMap = undefined;
      }

      return {
        AtRule: {
          media: atRule => {
            if (!atRule.parent) return;
            if (atRule.parent.parent && atRule.parent.parent.type !== 'root') {
              return;
            }

            if (atRule.parent.type !== 'root') {
              const newAtRule = new AtRule({
                name: (atRule.parent as AtRule).name,
                params: (atRule.parent as AtRule).params,
              });

              atRule.each(rule => {
                newAtRule.append(rule);
              });
              atRule.remove();
              atRule.removeAll();
              atRule.append(newAtRule);
            }

            const queryList = atRule.params;
            const past = queries[queryList];

            if (typeof past === 'object') {
              atRule.each(rule => {
                past.append(rule.clone());
              });
            } else {
              queries[queryList] = atRule.clone();
              queryLists.push(queryList);
            }

            atRule.remove();
          },
        },
        OnceExit(root) {
          sortQueryLists(queryLists, opts.sort).forEach((ql: string) => {
            root.append(queries[ql]);
          });

          if (sourceMap) {
            root.append(sourceMap);
          }
        },
      };
    },
  };
};

postcssMergeQueries.postcss = true;

export default postcssMergeQueries;
