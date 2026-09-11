import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import { parseCsv } from '../utils/csv.js';

// Wrap in quotes and double any inner quotes, so a comma in a description
// doesn't split the column
const cell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const titleCase = (str) =>
  String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const splitList = (value) =>
  String(value || '')
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);

const num = (value) => {
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export const CSV_HEADERS = [
  'Handle',
  'Name',
  'Description',
  'Category',
  'Tags',
  'Status',
  'Featured',
  'Images',
  'Price',
  'Compare at price',
  'Stock',
  'Option1 name',
  'Option1 value',
  'Option2 name',
  'Option2 value',
  'Variant SKU',
  'Variant price',
  'Variant compare at',
  'Variant stock',
  'Variant image',
];

// GET /api/products/export  — admin
export const exportProducts = asyncHandler(async (req, res) => {
  const filter = {};

  // A specific selection wins over every other filter
  if (req.query.ids) {
    const ids = req.query.ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      res.status(400);
      throw new Error('No products selected');
    }

    filter._id = { $in: ids };
  } else {
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'All') {
      filter.categoryName = req.query.category;
    }

    if (req.query.keyword) {
      filter.name = { $regex: req.query.keyword, $options: 'i' };
    }

    if (req.query.stock === 'out') {
      filter.countInStock = 0;
    } else if (req.query.stock === 'low') {
      filter.countInStock = { $gt: 0, $lt: 5 };
    } else if (req.query.stock === 'in') {
      filter.countInStock = { $gte: 5 };
    }
  }

  const products = await Product.find(filter).sort({ name: 1 });

  const rows = [];

  for (const p of products) {
    // Product-level fields, shared by every row for this product
    const base = [
      p.handle || '',
      p.name,
      p.description,
      p.categoryName,
      (p.tags || []).join('|'),
      p.status,
      p.isFeatured ? 'yes' : 'no',
      (p.images || []).join('|'),
    ];

    if (!p.variants?.length) {
      rows.push(
        [
          ...base,
          p.price,
          p.compareAtPrice ?? '',
          p.countInStock,
          '', '', '', '', '', '', '', '', '',
        ]
          .map(cell)
          .join(',')
      );

      continue;
    }

    // One row per variant. Product fields repeat only on the first row,
    // the same convention Shopify uses.
    p.variants.forEach((v, i) => {
      const productCells =
        i === 0 ? base : [p.handle || '', '', '', '', '', '', '', ''];

      const o1 = v.options[0];
      const o2 = v.options[1];

      rows.push(
        [
          ...productCells,
          i === 0 ? p.price : '',
          i === 0 ? p.compareAtPrice ?? '' : '',
          i === 0 ? p.countInStock : '',
          o1?.name || '',
          o1?.value || '',
          o2?.name || '',
          o2?.value || '',
          v.sku || '',
          v.price,
          v.compareAtPrice ?? '',
          v.countInStock,
          v.image || '',
        ]
          .map(cell)
          .join(',')
      );
    });
  }

  // BOM so Excel reads UTF-8 correctly
  const csv = `\uFEFF${CSV_HEADERS.map(cell).join(',')}\n${rows.join('\n')}`;
  const stamp = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="shopnest-products-${stamp}.csv"`
  );

  res.send(csv);
});

// GET /api/products/template  — admin
// A CSV with example rows, so nobody has to guess the format
export const downloadTemplate = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ parent: { $ne: null } });
  const example = category?.name || 'Pendants';

  const examples = [
    [
      'gold-knot-earrings',
      'Gold Knot Earrings',
      'A pair of interlocking knot studs in gold plate.',
      example,
      'knot|gold-plated|everyday',
      'active',
      'no',
      'https://res.cloudinary.com/your-cloud/image/upload/example.jpg',
      '3200',
      '4000',
      '18',
      '', '', '', '', '', '', '', '', '',
    ],
    [
      'example-with-variants',
      'Example With Variants',
      'Delete these example rows before importing.',
      example,
      'example',
      'draft',
      'no',
      '',
      '', '', '',
      'Color', 'Ivory', 'Size', 'Small',
      'EX-IV-S', '2500', '', '10', '',
    ],
    [
      'example-with-variants',
      '', '', '', '', '', '', '',
      '', '', '',
      'Color', 'Ivory', 'Size', 'Large',
      'EX-IV-L', '2800', '', '6', '',
    ],
  ];

  const rows = examples.map((r) => r.map(cell).join(','));
  const csv = `\uFEFF${CSV_HEADERS.map(cell).join(',')}\n${rows.join('\n')}`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="shopnest-product-template.csv"'
  );

  res.send(csv);
});

// POST /api/products/import  — admin
// Body: { csv: "...", dryRun: true }
export const importProducts = asyncHandler(async (req, res) => {
  const { csv, dryRun } = req.body;

  // all: create and update. new: skip anything that already exists.
  // update: only touch products that already exist.
  const mode = ['all', 'new', 'update'].includes(req.body.mode)
    ? req.body.mode
    : 'all';

  if (!csv?.trim()) {
    res.status(400);
    throw new Error('No CSV content received');
  }

  const { headers, records } = parseCsv(csv);

  const required = ['Handle', 'Name', 'Category'];
  const missing = required.filter((h) => !headers.includes(h));

  if (missing.length) {
    res.status(400);
    throw new Error(`Your file is missing these columns: ${missing.join(', ')}`);
  }

  if (records.length === 0) {
    res.status(400);
    throw new Error('That file has headers but no rows');
  }

  // Group rows by handle. Variant rows repeat the handle with blank
  // product fields, so the first row of each group carries the details.
  const groups = new Map();

  records.forEach((r, index) => {
    const handle = r.Handle?.trim() || slugify(r.Name);
    if (!handle) return;

    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle).push({ ...r, __row: index + 2 }); // +2: header + 1-index
  });

  const categories = await Category.find({});
  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c])
  );

  const results = { created: [], updated: [], skipped: [], errors: [] };

  for (const [handle, rows] of groups) {
    const head = rows[0];

    try {
      const name = head.Name?.trim();

      if (!name) {
        results.errors.push({
          row: head.__row,
          handle,
          message: 'Name is required',
        });
        continue;
      }

      const categoryName = head.Category?.trim();
      const category = categoryByName.get(categoryName?.toLowerCase());

      if (!category) {
        results.errors.push({
          row: head.__row,
          handle,
          message: `Category "${categoryName}" does not exist. Create it first.`,
        });
        continue;
      }

      // Variant rows are those carrying an Option1 value
      const variantRows = rows.filter((r) => r['Option1 value']?.trim());

      const variants = [];
      const optionValues = new Map();

      for (const r of variantRows) {
        const options = [];

        [1, 2].forEach((n) => {
          const oName = r[`Option${n} name`]?.trim();
          const oValue = r[`Option${n} value`]?.trim();

          if (oName && oValue) {
            const clean = { name: titleCase(oName), value: titleCase(oValue) };
            options.push(clean);

            if (!optionValues.has(clean.name)) {
              optionValues.set(clean.name, new Set());
            }
            optionValues.get(clean.name).add(clean.value);
          }
        });

        if (options.length === 0) continue;

        const price = num(r['Variant price']);

        if (price === null || price < 0) {
          results.errors.push({
            row: r.__row,
            handle,
            message: 'Variant price is missing or not a number',
          });
          continue;
        }

        variants.push({
          options,
          sku: r['Variant SKU']?.trim() || '',
          price,
          compareAtPrice: num(r['Variant compare at']) || null,
          countInStock: Math.max(0, Math.floor(num(r['Variant stock']) || 0)),
          image: r['Variant image']?.trim() || '',
        });
      }

      const optionTypes = [...optionValues.entries()].map(([oName, set]) => ({
        name: oName,
        values: [...set],
      }));

      const basePrice = variants.length
        ? Math.min(...variants.map((v) => v.price))
        : num(head.Price);

      if (basePrice === null || basePrice < 0) {
        results.errors.push({
          row: head.__row,
          handle,
          message: 'Price is missing or not a number',
        });
        continue;
      }

      const payload = {
        name,
        handle,
        description: head.Description?.trim() || name,
        category: category._id,
        categoryName: category.name,
        tags: splitList(head.Tags),
        status:
          head.Status?.trim().toLowerCase() === 'draft' ? 'draft' : 'active',
        isFeatured: ['yes', 'true', '1'].includes(
          head.Featured?.trim().toLowerCase()
        ),
        images: splitList(head.Images),
        price: basePrice,
        compareAtPrice: num(head['Compare at price']) || null,
        countInStock: variants.length
          ? variants.reduce((s, v) => s + v.countInStock, 0)
          : Math.max(0, Math.floor(num(head.Stock) || 0)),
        optionTypes,
        variants,
      };

      const existing = await Product.findOne({ handle });

      // Honour the chosen mode before writing anything
      if (existing && mode === 'new') {
        results.skipped.push({ handle, name, reason: 'already exists' });
        continue;
      }

      if (!existing && mode === 'update') {
        results.skipped.push({ handle, name, reason: 'not in the store yet' });
        continue;
      }

      // A dry run reports what would happen without writing anything
      if (dryRun) {
        results[existing ? 'updated' : 'created'].push({ handle, name });
        continue;
      }

      if (existing) {
        // Keep variant _ids so open carts and orders stay valid
        const byCombo = new Map(
          existing.variants.map((v) => [
            v.options.map((o) => `${o.name}:${o.value}`).join('|'),
            v._id,
          ])
        );

        Object.assign(existing, payload);

        existing.variants = payload.variants.map((v) => {
          const key = v.options.map((o) => `${o.name}:${o.value}`).join('|');
          const id = byCombo.get(key);
          return id ? { ...v, _id: id } : v;
        });

        await existing.save();
        results.updated.push({ handle, name });
      } else {
        await Product.create(payload);
        results.created.push({ handle, name });
      }
    } catch (error) {
      results.errors.push({ row: head.__row, handle, message: error.message });
    }
  }

  res.json({
    dryRun: Boolean(dryRun),
    mode,
    totalRows: records.length,
    products: groups.size,
    created: results.created.length,
    updated: results.updated.length,
    skipped: results.skipped.length,
    errors: results.errors,
    details: {
      created: results.created.slice(0, 50),
      updated: results.updated.slice(0, 50),
    },
  });
});