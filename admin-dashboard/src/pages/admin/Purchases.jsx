import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { EmptyRow, Field, FilterBar, GhostBtn, Loading, PageTitle, PrimaryBtn, SelectInput, TableShell, Td, TextInput, Th } from './AdminUI';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminPurchases() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [user, setUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load() {
    setRows(null);
    const params = {};
    if (status) params.status = status;
    if (product.trim()) params.product = product.trim();
    if (user.trim()) params.user = user.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get('/admin/purchases', { params });
    setRows(data.purchases);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <PageTitle title="Purchases / Orders" subtitle="Every product purchase across the platform" />

      <FilterBar>
        <Field label="Status">
          <SelectInput value={status} onChange={setStatus} options={statusOptions} />
        </Field>
        <Field label="Product">
          <TextInput value={product} onChange={setProduct} placeholder="Product name" />
        </Field>
        <Field label="User">
          <TextInput value={user} onChange={setUser} placeholder="User ID or mobile" />
        </Field>
        <Field label="From date">
          <TextInput value={dateFrom} onChange={setDateFrom} className="[&::-webkit-calendar-picker-indicator]:opacity-0" placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="To date">
          <TextInput value={dateTo} onChange={setDateTo} placeholder="YYYY-MM-DD" />
        </Field>
        <div className="flex gap-2">
          <PrimaryBtn onClick={load}>Apply</PrimaryBtn>
          <GhostBtn
            onClick={() => {
              setStatus('');
              setProduct('');
              setUser('');
              setDateFrom('');
              setDateTo('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </GhostBtn>
        </div>
      </FilterBar>

      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>Purchase ID</Th>
              <Th>User ID</Th>
              <Th>Mobile</Th>
              <Th>Product</Th>
              <Th>Price</Th>
              <Th>Amount Paid</Th>
              <Th>Duration</Th>
              <Th>Status</Th>
              <Th>Purchased</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr><td colSpan={9}><Loading /></td></tr>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={9} />
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="hover:bg-parchment/50">
                  <Td className="font-mono text-xs text-muted">{row._id.toString().slice(-7)}</Td>
                  <Td className="font-semibold text-burgundy">{row.userId?.userId}</Td>
                  <Td>{row.userId?.mobile}</Td>
                  <Td className="font-semibold">{row.productName}</Td>
                  <Td>{inr(row.price)}</Td>
                  <Td>{inr(row.price)}</Td>
                  <Td>{row.durationDays}d</Td>
                  <Td><StatusBadge status={row.status} /></Td>
                  <Td className="text-muted">{formatDate(row.createdAt)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTable({ title, headers = ['User', 'Detail', 'Amount', 'Status', 'Date'], children }) {
  return (
    <div>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-5 overflow-x-auto premium-card rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment text-xs uppercase tracking-wider text-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}