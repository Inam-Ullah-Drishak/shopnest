import { useState } from 'react';
import { Plus, X, Wand2, ImageOff } from 'lucide-react';

// "navy blue" -> "Navy Blue"
const titleCase = (str) =>
  str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// Cartesian product of every option type's values
const buildCombinations = (optionTypes) => {
  const usable = optionTypes.filter(
    (t) => t.name.trim() && t.values.length > 0
  );

  if (usable.length === 0) return [];

  return usable.reduce(
    (acc, type) =>
      acc.flatMap((combo) =>
        type.values.map((value) => [
          ...combo,
          { name: titleCase(type.name), value },
        ])
      ),
    [[]]
  );
};

const comboKey = (options) =>
  options.map((o) => `${o.name}:${o.value}`).join('|');

function VariantEditor({
  optionTypes,
  setOptionTypes,
  variants,
  setVariants,
  basePrice,
  images,
}) {
  const [valueInputs, setValueInputs] = useState({});

  const addOptionType = () =>
    setOptionTypes([...optionTypes, { name: '', values: [] }]);

  const removeOptionType = (index) => {
    setOptionTypes(optionTypes.filter((_, i) => i !== index));
    setVariants([]);
  };

  const renameOptionType = (index, name) =>
    setOptionTypes(
      optionTypes.map((t, i) => (i === index ? { ...t, name } : t))
    );

  // Tidy the casing once the admin leaves the field, not while typing
  const normalizeOptionType = (index) =>
    setOptionTypes(
      optionTypes.map((t, i) =>
        i === index ? { ...t, name: titleCase(t.name) } : t
      )
    );

  const addValue = (index) => {
    const raw = titleCase(valueInputs[index] || '');
    if (!raw) return;

    const type = optionTypes[index];
    if (type.values.some((v) => v.toLowerCase() === raw.toLowerCase())) {
      setValueInputs({ ...valueInputs, [index]: '' });
      return;
    }

    setOptionTypes(
      optionTypes.map((t, i) =>
        i === index ? { ...t, values: [...t.values, raw] } : t
      )
    );

    setValueInputs({ ...valueInputs, [index]: '' });
  };

  const removeValue = (index, value) =>
    setOptionTypes(
      optionTypes.map((t, i) =>
        i === index
          ? { ...t, values: t.values.filter((v) => v !== value) }
          : t
      )
    );

  // Rebuild the variant list, keeping data for combinations that still exist
  const generate = () => {
    const combos = buildCombinations(optionTypes);

    const existing = new Map(variants.map((v) => [comboKey(v.options), v]));

    setVariants(
      combos.map((options) => {
        const previous = existing.get(comboKey(options));

        return (
          previous || {
            options,
            sku: '',
            price: Number(basePrice) || 0,
            countInStock: 0,
            image: '',
          }
        );
      })
    );
  };

  const updateVariant = (index, field, value) =>
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );

  const removeVariant = (index) =>
    setVariants(variants.filter((_, i) => i !== index));

  const pendingCount = buildCombinations(optionTypes).length;

  return (
    <div className="border rounded-lg p-4 space-y-5">
      <div>
        <p className="font-medium text-sm">Options</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Add options like Size or Colour if this product comes in more than one
          version. Leave empty for a simple product.
        </p>
      </div>

      {optionTypes.map((type, index) => (
        <div key={index} className="border rounded-lg p-3 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={type.name}
              onChange={(e) => renameOptionType(index, e.target.value)}
              onBlur={() => normalizeOptionType(index)}
              placeholder="Size"
              className="flex-1 border rounded-lg p-2 text-sm bg-white"
            />

            <button
              type="button"
              onClick={() => removeOptionType(index)}
              title="Remove option"
              className="p-2 rounded text-red-600 hover:bg-red-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {type.values.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {type.values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 bg-white border rounded-full pl-3 pr-1.5 py-1 text-sm"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(index, value)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={valueInputs[index] || ''}
              onChange={(e) =>
                setValueInputs({ ...valueInputs, [index]: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addValue(index);
                }
              }}
              placeholder="Small"
              className="flex-1 border rounded-lg p-2 text-sm bg-white"
            />

            <button
              type="button"
              onClick={() => addValue(index)}
              className="border rounded-lg px-3 text-sm bg-white hover:bg-gray-100 cursor-pointer"
            >
              Add value
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addOptionType}
          className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
        >
          <Plus size={16} />
          Add option
        </button>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <Wand2 size={16} />
            Generate {pendingCount} variant{pendingCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-2 font-medium">Variant</th>
                <th className="p-2 font-medium">Price</th>
                <th className="p-2 font-medium">Stock</th>
                <th className="p-2 font-medium">SKU</th>
                <th className="p-2 font-medium">Image</th>
                <th className="p-2"></th>
              </tr>
            </thead>

            <tbody>
              {variants.map((variant, index) => (
                <tr key={comboKey(variant.options)} className="border-t">
                  <td className="p-2 font-medium whitespace-nowrap">
                    {variant.options.map((o) => o.value).join(' / ')}
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(index, 'price', Number(e.target.value))
                      }
                      className="w-24 border rounded p-1.5"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={variant.countInStock}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'countInStock',
                          Number(e.target.value)
                        )
                      }
                      className="w-20 border rounded p-1.5"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, 'sku', e.target.value)
                      }
                      placeholder="optional"
                      className="w-28 border rounded p-1.5"
                    />
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                        {variant.image ? (
                          <img
                            src={variant.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff size={13} className="text-gray-300" />
                        )}
                      </div>

                      <select
                        value={variant.image}
                        onChange={(e) =>
                          updateVariant(index, 'image', e.target.value)
                        }
                        className="border rounded p-1.5 max-w-32"
                      >
                        <option value="">Use main</option>
                        {images.map((src, i) => (
                          <option key={src} value={src}>
                            Photo {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      title="Remove variant"
                      className="p-1.5 rounded text-red-600 hover:bg-red-100 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VariantEditor;