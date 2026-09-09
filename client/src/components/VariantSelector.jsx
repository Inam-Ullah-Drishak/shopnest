function VariantSelector({ optionTypes, variants, selected, onSelect }) {
  // Which values are still reachable given what's already chosen
  const isAvailable = (optionName, value) => {
    const trial = { ...selected, [optionName]: value };

    return variants.some((variant) =>
      Object.entries(trial).every(([name, val]) =>
        variant.options.some((o) => o.name === name && o.value === val)
      )
    );
  };

  const isInStock = (optionName, value) => {
    const trial = { ...selected, [optionName]: value };

    return variants.some(
      (variant) =>
        variant.countInStock > 0 &&
        Object.entries(trial).every(([name, val]) =>
          variant.options.some((o) => o.name === name && o.value === val)
        )
    );
  };

  return (
    <div className="space-y-4">
      {optionTypes.map((type) => (
        <div key={type.name}>
          <p className="font-medium text-sm mb-2">
            {type.name}
            {selected[type.name] && (
              <span className="text-gray-500 font-normal">
                {' '}
                · {selected[type.name]}
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {type.values.map((value) => {
              const active = selected[type.name] === value;
              const available = isAvailable(type.name, value);
              const stocked = isInStock(type.name, value);

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSelect(type.name, value)}
                  disabled={!available}
                  title={
                    !available
                      ? 'Not available'
                      : !stocked
                      ? 'Out of stock'
                      : undefined
                  }
                  className={`px-4 py-2 rounded-lg border text-sm transition ${
                    active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : !available
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : !stocked
                      ? 'border-gray-200 text-gray-400 line-through cursor-pointer hover:border-gray-300'
                      : 'border-gray-300 hover:border-gray-900 cursor-pointer'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default VariantSelector;