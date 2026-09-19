import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead, CornerEmblem, downloadPDF } from '../../components/ui';
import { useAuth } from '../../AuthContext';
import { today, inr, numberToWords, fmtDate } from '../../utils';

/* ---------- A4 Invoice ---------- */
export function ITInvoice({ data, onClose }) {
  const ref = useRef();
  const { settings: s } = useAuth();
  if (!data) return null;
  const gstP = Number(s?.gst_percent ?? 18);
  const gst = Number(data.amount) * gstP / 100;
  const total = Number(data.amount) + gst;
  return (
    <Modal open onClose={onClose} title={`Invoice ${data.receipt_no}`} width={900}>
      <div className="receipt-actions no-print">
        <button className="btn maroon" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn ghost" onClick={() => downloadPDF(ref.current, `invoice-${data.receipt_no}.pdf`)}>⬇️ Save PDF</button>
      </div>
      <div className="print-area invoice-a4" ref={ref}>
        <div className="rc-head">
          <img className="rc-logo" src={s?.logo || '/logo.png'} alt="logo" onError={e => e.target.style.visibility = 'hidden'} />
          <div className="rc-center">
            <div className="rc-name">{s?.name || 'AJ INFO TECH'}</div>
            <div className="rc-tag">IT Solutions | Institute</div>
            <div className="rc-gst">GSTIN: {s?.gstin || '33ANHPL4615N1ZT'}</div>
            <div className="rc-addr">{s?.address || '12c, 1st Floor, Bus Stand Road, Merin Super Market, Jayankondam, Ariyalur- 621802'}</div>
            <div className="rc-addr">Mobile: {s?.mobile || '9003485703'}</div>
          </div>
          <CornerEmblem size={80} />
        </div>
        <div className="rc-rule"><span /></div>
        <div style={{ textAlign: 'center', color: '#6d0f21', fontWeight: 800, fontSize: 14, margin: '10px 0' }}>INVOICE</div>
        <div className="rc-row">
          <b style={{ fontSize: 12 }}>Receipt No: {data.receipt_no}</b>
          <span style={{ fontSize: 12 }}>Date: {fmtDate(data.pay_date)}</span>
        </div>
        <div className="bill-to">
          <b>Bill To:</b><br />
          <b style={{ color: '#6d0f21' }}>{data.company_name}</b><br />
          {data.address || '-'}<br />
          GST: {data.gst || '-'}
        </div>
        <table className="inv-table">
          <thead><tr><th>S.No</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>{data.project_name} — {data.payment_type === 'monthly' ? 'Monthly Service Payment' : 'Project Payment (Installment)'}</td>
              <td>1</td>
              <td>₹{Number(data.amount).toLocaleString('en-IN')}</td>
              <td>₹{Number(data.amount).toLocaleString('en-IN')}</td>
            </tr>
            <tr><td colSpan="4" style={{ textAlign: 'right' }}>GST {gstP}%</td><td>₹{gst.toLocaleString('en-IN')}</td></tr>
            <tr className="tot"><td colSpan="4" style={{ textAlign: 'right' }}>GRAND TOTAL</td><td>₹{total.toLocaleString('en-IN')}</td></tr>
          </tbody>
        </table>
        <div className="rc-row" style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11 }}>
            Amount in words: <b>{data.amount_words}</b><br />
            Payment Method: <b>{data.method}</b>
          </div>
          <div className="rc-sign">{s?.sign_image ? <img src={s.sign_image} alt="" style={{ height: 46 }} /> : null}<br />Authorized Signature</div>
        </div>
        {s?.seal_image && <img src={s.seal_image} alt="seal" style={{ width: 95, opacity: .8, marginTop: 10 }} />}
        {s?.footer_note && <div className="rc-note">{s.footer_note}</div>}
      </div>
    </Modal>
  );
}

/* ---------- Page ---------- */
export default function ITPayments() {
  const [rows, setRows] = useState([]);
  const [pay, setPay] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState(null);
  const [histRows, setHistRows] = useState([]);
  const [f, setF] = useState({ amount: '', amount_words: '', method: 'Cash', pay_date: today(), remark: '' });

  const load = async () => setRows((await api.get('/it/projects-billing')).data);
  useEffect(() => { load(); }, []);

  const pending = rows.reduce((a, r) => a + Math.max(0, r.balance), 0);
  const openPay = r => { setPay(r); setF({ amount: String(Math.max(0, r.balance)), amount_words: '', method: 'Cash', pay_date: today(), remark: '' }); };
  const setAmt = v => setF({ ...f, amount: v, amount_words: numberToWords(v) });

  const confirmPay = async () => {
    if (!Number(f.amount)) return alert('Enter amount');
    const { data } = await api.post('/it/payments', { ...f, project_id: pay.id, amount: Number(f.amount) });
    setPay(null);
    setInvoice({ receipt_no: data.receipt_no, pay_date: f.pay_date, amount: Number(f.amount),
      amount_words: f.amount_words, method: f.method, project_name: pay.project_name,
      payment_type: pay.payment_type, company_name: pay.company_name, address: pay.address, gst: pay.gst });
    load();
  };
  const openHistory = async r => {
    setHistory(r);
    setHistRows((await api.get(`/it/payments?project_id=${r.id}`)).data);
  };

  return (
    <div>
      <PageHead title="Payment">
        <div className="pending-chip">Total Pending Payment : <b>{inr(pending)}</b></div>
      </PageHead>
      <DataTable rows={rows} columns={[
        { key: 'project_id', label: 'Project ID' },
        { key: 'project_name', label: 'Project Name' },
        { key: 'client', label: 'Client', render: r => r.client_name || '-' },
        { key: 'payment_type', label: 'Payment Type', render: r => (
          <span className={`pill ${r.payment_type === 'monthly' ? 'pill-gold' : 'pill-maroon'}`}>
            {r.payment_type === 'monthly' ? 'Monthly' : 'Installment'}</span>) },
        { key: 'paid', label: 'Paid Amount', render: r => inr(r.paid) },
        { key: 'balance', label: 'Balance Amount', render: r => r.balance > 0 ? <span className="text-red">{inr(r.balance)}</span> : <span className="text-green">{inr(0)}</span> },
      ]} actions={r => (
        <>
          <button className="icon-btn green" title="Pay" onClick={() => openPay(r)}>💵</button>
          <button className="icon-btn gold" title="Receipts" onClick={() => openHistory(r)}>🧾</button>
        </>
      )} />

      <Modal open={!!pay} onClose={() => setPay(null)} title="Collect Payment" width={540}>
        {pay && (
          <>
            <div className="user-row" style={{ marginBottom: 16 }}>
              <b>{pay.client_name}</b> — {pay.company_name}<br />
              Project: <b>{pay.project_name}</b><br />
              Total: <b>{inr(pay.payable)}</b> &nbsp;|&nbsp; Payable Now: <b className="text-red">{inr(Math.max(0, pay.balance))}</b>
            </div>
            <div className="form-grid">
              <F label="Amount (₹)"><input type="number" value={f.amount} onChange={e => setAmt(e.target.value)} /></F>
              <F label="Payment Method">
                <select value={f.method} onChange={e => setF({ ...f, method: e.target.value })}>
                  <option>Cash</option><option>GPAY</option><option>Bank</option>
                </select>
              </F>
              <F label="Amount in Words" full><input value={f.amount_words} onChange={e => setF({ ...f, amount_words: e.target.value })} /></F>
              <F label="Date"><input type="date" value={f.pay_date} onChange={e => setF({ ...f, pay_date: e.target.value })} /></F>
              <F label="Remark (optional)"><input value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} /></F>
            </div>
            <div className="form-actions">
              <button className="btn ghost" onClick={() => setPay(null)}>Cancel</button>
              <button className="btn green" onClick={confirmPay}>✔ Confirm & Receipt</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!history} onClose={() => setHistory(null)} title={`Receipts — ${history?.project_name || ''}`} width={640}>
        <DataTable rows={histRows} columns={[
          { key: 'sno', label: 'S.No', render: (r, i) => i },
          { key: 'receipt_no', label: 'Receipt No' },
          { key: 'pay_date', label: 'Date', render: r => fmtDate(r.pay_date) },
          { key: 'amount', label: 'Amount', render: r => inr(r.amount) },
        ]} actions={r => <button className="icon-btn gold" title="Print" onClick={() => setInvoice(r)}>🖨️</button>} />
      </Modal>

      {invoice && <ITInvoice data={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}