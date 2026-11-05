'use client';

// Developer showcase of Quiet Utility primitives and their states (no real data, no API calls).
import { typeScale, type TypeToken } from '@smart-parking/design-tokens';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  StatusLabel,
  TextField,
  ThemeSwitcher,
} from '@smart-parking/ui-web';
import { useState } from 'react';

type Row = { id: string; plate: string; entered: string; fee: string };
const rows: Row[] = [
  { id: 'T-000142', plate: 'ABC 1234', entered: '08:12', fee: '50.00' },
  { id: 'T-000143', plate: 'NBF 5521', entered: '08:40', fee: '70.00' },
];
const columns = [
  {
    key: 'id',
    header: 'Ticket',
    cell: (r: Row) => <span className="font-mono text-data">{r.id}</span>,
  },
  {
    key: 'plate',
    header: 'Plate',
    cell: (r: Row) => <span className="font-mono text-data">{r.plate}</span>,
  },
  { key: 'entered', header: 'Entered', cell: (r: Row) => r.entered, numeric: true },
  { key: 'fee', header: 'Fee (PHP)', cell: (r: Row) => r.fee, numeric: true },
];

const typeClass: Record<TypeToken, string> = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  body: 'text-body',
  compact: 'text-compact',
  label: 'text-label',
  caption: 'text-caption',
  data: 'text-data font-mono',
};

export function DesignShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tableState, setTableState] = useState<'success' | 'pending' | 'error'>('success');

  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-12 px-4 py-16 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-label text-ink-muted">Quiet Utility</p>
        <h1 className="text-h1">Design system</h1>
        <ThemeSwitcher />
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="type">
        <h2 id="type" className="text-h2">
          Type scale
        </h2>
        {(Object.keys(typeScale) as TypeToken[]).map((token) => (
          <p key={token} className={`${typeClass[token]} flex flex-wrap items-baseline gap-x-4`}>
            <span>{token === 'data' ? 'T-000142 · 08:12 · 1,250.00' : 'Confirm vehicle exit'}</span>
            <span className="font-mono text-caption text-ink-faint">
              {token} {typeScale[token].mobile}/{typeScale[token].web}px · {typeScale[token].weight}
            </span>
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="buttons">
        <h2 id="buttons" className="text-h2">
          Buttons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Create case</Button>
          <Button loading loadingLabel="Saving…">
            Save changes
          </Button>
          <Button disabled>Unavailable</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="text">View resolved cases</Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2" aria-labelledby="fields">
        <h2 id="fields" className="text-h2 sm:col-span-2">
          Fields and status
        </h2>
        <TextField label="Plate number" helper="Letters and digits, e.g. ABC 1234" optional />
        <TextField
          label="Amount tendered"
          error="Enter an amount of at least the amount due"
          defaultValue="20"
        />
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <StatusLabel tone="positive">Verified</StatusLabel>
          <StatusLabel tone="pending">Pending</StatusLabel>
          <StatusLabel tone="attention">Needs review</StatusLabel>
          <StatusLabel tone="negative">Failed</StatusLabel>
          <StatusLabel tone="neutral">Closed</StatusLabel>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="table">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="table" className="text-h2">
            Table
          </h2>
          <div className="flex gap-2">
            {(['success', 'pending', 'error'] as const).map((state) => (
              <Button
                key={state}
                variant="secondary"
                onClick={() => setTableState(state)}
                aria-pressed={tableState === state}
              >
                {state === 'success' ? 'Rows' : state === 'pending' ? 'Loading' : 'Error'}
              </Button>
            ))}
          </div>
        </div>
        <DataTable
          caption="Active parking sessions (sample)"
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          status={tableState}
          emptyMessage="No active sessions at this facility"
          onRetry={() => setTableState('success')}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="dialogs">
        <h2 id="dialogs" className="text-h2">
          Dialogs
        </h2>
        <Card className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open form dialog
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Open confirmation
          </Button>
        </Card>
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Create support case"
        description="Tell us what happened. Relevant parking data can be linked."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Create case</Button>
          </>
        }
      >
        <TextField label="Subject" autoFocus />
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Suspend this operator?"
        description="Existing sessions are affected. Staff can no longer check in vehicles."
        confirmLabel="Suspend operator"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
