import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead, CornerEmblem, downloadPDF } from '../../components/ui';
import { useAuth } from '../../AuthContext';
import { today, inr, numberToWords, fmtDate } from '../../utils';

/* ---------- Half A4 Receipt ---------- */
export function InstReceipt({ data, onClose }) {
  const ref = useRef();
  const { settings: s } = useAuth();
  if (!data) return null;
  return (
    <Modal open onClose={onClose} title={`Receipt ${data.receipt_no}`} width={860}>
      <div className="receipt-actions no-print">
        <button className="btn maroon" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn ghost" onClick={() => downloadPDF(ref.current, `receipt-${data.receipt_no}.pdf`, [210, 148.5])}>⬇️ Save PDF</button>
      </div>
      <div className="print-area receipt-half" ref={ref}>
        <div class="rcbo">
        <div className="rc-head">
          <img className="rc-logo" src={s?.logo || '/logo.png'} alt="logo" onError={e => e.target.style.visibility = 'hidden'} />
          <div className="rc-center">
            <div className="rc-name">{s?.name || 'AJ INFO TECH'}</div>
            <div className="rc-tag">IT Solutions | Institute</div>
            <div className="rc-gst">GSTIN: {s?.gstin || '33ANHPL4615N1ZT'}</div>
            <div className="rc-addr">{s?.address || '12c, 1st Floor, Bus Stand Road, Merin Super Market, Jayankondam, Ariyalur- 621802'}</div>
            <div className="rc-addr">Mobile: {s?.mobile || '9003485703'}</div>
          </div>
          <CornerEmblem size={72} />
        </div>
        <div className="rc-rule"><span /></div>
        <div className="rc-row">
          <b style={{ fontSize: 16 }}>Receipt No: {data.receipt_no}</b>
          <span style={{ fontSize: 16 }}>Date: {fmtDate(data.pay_date)}</span>
        </div>
        <p className="rc-body">
                                 Received with thanks from Mr./Ms. <b>{data.student_name}</b> a sum of ₹{Number(data.amount).toLocaleString('en-IN')}
          {' '}({data.amount_words}) towards the <b>{data.course_name}</b> course fee for the period of
          {' '}<b>{data.duration_days || '-'} days</b>. Payment was made through <b>{data.method}</b> Transfer on {s?.name || 'AJ INFO TECH'}.
        </p>
        <div className="rc-row">
          <div style={{ fontSize: 18 }}>
            <b>Amount Paid: ₹{Number(data.amount).toLocaleString('en-IN')}</b><br />
            Balance: {data.balance > 0 ? <span className="text-red">₹{Number(data.balance).toLocaleString('en-IN')}</span> : <b>Nill</b>}
          </div>
          <div className="rc-sign">{s?.sign_image ? <img src={s.sign_image} alt="sign" style={{ height: 46, objectFit: 'contain' }} /> : null}<br />Authorized Signature</div>
        </div>
        {s?.seal_image && <img src={s.seal_image} alt="seal" style={{ width: 90, opacity: .8, marginTop: 6 }} />}
        {s?.footer_note && <div className="rc-note">{s.footer_note}</div>}
      </div>
      </div>
    </Modal>
  );
}

/* ---------- Page ---------- */
export default function InstPayments() {
  const [rows, setRows] = useState([]);
  const [pay, setPay] = useState(null);         // billing row being paid
  const [receipt, setReceipt] = useState(null); // receipt data
  const [history, setHistory] = useState(null); // student for history modal
  const [histRows, setHistRows] = useState([]);
  const [f, setF] = useState({ amount: '', amount_words: '', method: 'Cash', pay_date: today(), remark: '' });

  const load = async () => setRows((await api.get('/inst/billing')).data);
  useEffect(() => { load(); }, []);

  const pendingTotal = rows.reduce((a, r) => a + Math.max(0, r.balance), 0);

  const openPay = r => { setPay(r); setF({ amount: r.balance > 0 ? String(r.balance) : '', amount_words: '', method: 'Cash', pay_date: today(), remark: '' }); };
  const setAmt = v => setF({ ...f, amount: v, amount_words: numberToWords(v) });

  const confirmPay = async () => {
    if (!Number(f.amount)) return alert('Enter amount');
    const { data } = await api.post('/inst/payments', { ...f, student_id: pay.id, amount: Number(f.amount) });
    const newBalance = Math.max(0, pay.balance - Number(f.amount));
    setPay(null);
    setReceipt({ receipt_no: data.receipt_no, pay_date: f.pay_date, amount: Number(f.amount),
      amount_words: f.amount_words, method: f.method, balance: newBalance,
      student_name: pay.name, course_name: pay.course_name, duration_days: pay.duration_days });
    load();
  };

  const openHistory = async r => {
    setHistory(r);
    setHistRows((await api.get(`/inst/payments?student_id=${r.id}`)).data);
  };

  const balanceAfter = row => {   // fees − cumulative payments up to this receipt
    const sorted = [...histRows].sort((a, b) => a.id - b.id);
    const cum = sorted.filter(x => x.id <= row.id).reduce((a, x) => a + Number(x.amount), 0);
    return Math.max(0, Number(row.offer_fees || 0) - cum);
  };

  return (
    <div>
      <PageHead title="Payment">
        <div className="pending-chip">Total Pending Payment : <b>{inr(pendingTotal)}</b></div>
      </PageHead>
      <DataTable pageSize={15} rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'name', label: 'Student Name' },
        { key: 'course_name', label: 'Course Name' },
        { key: 'fees', label: 'Fees', render: r => inr(r.fees) },
        { key: 'paid', label: 'Paid Fees', render: r => inr(r.paid) },
        { key: 'balance', label: 'Balance Fees', render: r => r.balance > 0 ? <span className="text-red">{inr(r.balance)}</span> : <span className="text-green">{inr(0)}</span> },
        { key: 'status', label: 'Status / Installments', render: r => (
          <div>
            <span className={`pill ${r.status === 'overdue' ? 'pill-red' : 'pill-green'}`}>{r.status}</span>
            <div className="muted" style={{ marginTop: 4 }}>{r.paidInstallments}/{r.installments} inst. {r.nextDue && r.status !== 'paid' ? `• due ${r.nextDue}` : ''}</div>
          </div>) },
      ]} actions={r => (
        <>
          <button className="icon-btn green" title="Pay" onClick={() => openPay(r)}>💵</button>
          <button className="icon-btn gold" title="Receipts" onClick={() => openHistory(r)}>🧾</button>
        </>
      )} />

      {/* Pay modal */}
      <Modal open={!!pay} onClose={() => setPay(null)} title="Collect Payment" width={520}>
        {pay && (
          <>
            <div className="user-row" style={{ marginBottom: 16 }}>
              <b>{pay.name}</b> — {pay.course_name}<br />
              Total Fees: <b>{inr(pay.fees)}</b> &nbsp;|&nbsp; Balance Fees: <b className="text-red">{inr(pay.balance)}</b>
              <div className="muted">Installment {pay.paidInstallments + 1} of {pay.installments} ≈ {inr(pay.perInstallment)}</div>
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

      {/* Receipt history modal */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={`Receipts — ${history?.name || ''}`} width={620}>
        <DataTable pageSize={20} rows={histRows} columns={[
          { key: 'sno', label: 'S.No', render: (r, i) => i },
          { key: 'receipt_no', label: 'Receipt No' },
          { key: 'pay_date', label: 'Date', render: r => fmtDate(r.pay_date) },
          { key: 'amount', label: 'Amount', render: r => inr(r.amount) },
        ]} actions={r => (
          <button className="icon-btn gold" title="Print" onClick={() => setReceipt({ ...r, balance: balanceAfter(r) })}>🖨️</button>
        )} />
      </Modal>

      {receipt && <InstReceipt data={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}