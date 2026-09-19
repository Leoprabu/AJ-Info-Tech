export const today = () => new Date().toISOString().slice(0, 10);

export const fmtDate = d => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const inr = n => '₹ ' + Number(n || 0).toLocaleString('en-IN');

export function numberToWords(n) {
  n = Math.round(Number(n) || 0);
  if (!n) return 'Zero Rupees Only';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const t = x => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
  const h = x => x > 99 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + t(x % 100) : '') : t(x);
  let s = '', cr = Math.floor(n / 1e7); n %= 1e7;
  const lk = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) s += h(cr) + ' Crore ';
  if (lk) s += h(lk) + ' Lakh ';
  if (th) s += h(th) + ' Thousand ';
  if (n) s += h(n);
  return s.trim() + ' Rupees Only';
}

export const installmentsFor = days => (days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4);