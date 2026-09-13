import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { EmptyRow, Field, FilterBar, GhostBtn, Loading, PageTitle, PrimaryBtn, SelectInput, TableShell, Td, TextInput, Th } from './AdminUI';

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'commission', label: 'Commission' },
  { value: 'refund', label: 'Refund' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminTransactions() {
  const [rows, setRows] = useState(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load() {
    setRows(null);
    const params = {};
    if (type) params.type = type;
    if (status) params.status = status;
    if (user.trim()) params.user = user.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get('/admin/transactions', { params });
    setRows(data.transactions);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <PageTitle title="Transactions" subtitle="All financial transactions across the platform" />

      <FilterBar>
        <Field label="Type">
          <SelectInput value={type} onChange={setType} options={typeOptions} />
        </Field>
        <Field label="Status">
          <SelectInput value={status} onChange={setStatus} options={statusOptions} />
        </Field>
        <Field label="User">
          <TextInput value={user} onChange={setUser} placeholder="User ID or mobile" />
        </Field>
        <Field label="From date">
          <TextInput value={dateFrom} onChange={setDateFrom} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="To date">
          <TextInput value={dateTo} onChange={setDateTo} placeholder="YYYY-MM-DD" />
        </Field>
        <div className="flex gap-2">
          <PrimaryBtn onClick={load}>Apply</PrimaryBtn>
          <GhostBtn onClick={() => { setType(''); setStatus(''); setUser(''); setDateFrom(''); setDateTo(''); setTimeout(load, 0); }}>
            Clear
          </GhostBtn>
        </div>
      </FilterBar>

      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>Transaction ID</Th>
              <Th>User ID</Th>
              <Th>Mobile</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr><td colSpan={8}><Loading /></td></tr>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={8} />
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="hover:bg-parchment/50">
                  <Td className="font-mono text-xs text-muted">{row.transactionId}</Td>
                  <Td className="font-semibold text-burgundy">{row.userId || '—'}</Td>
                  <Td>{row.mobile || '—'}</Td>
                  <Td><span className="capitalize">{row.type}</span></Td>
                  <Td className="font-semibold">{inr(row.amount)}</Td>
                  <Td><StatusBadge status={row.status} /></Td>
                  <Td className="text-muted">{formatDate(row.createdAt)}</Td>
                  <Td className="max-w-56 whitespace-normal text-muted">{row.description || '—'}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}