export const formatPrice = (value) =>
  `Rs ${Number(value || 0).toLocaleString('en-PK')}`;

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });