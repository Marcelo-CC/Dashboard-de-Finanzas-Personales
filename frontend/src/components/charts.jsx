import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { formatMoney, shortMonthLabel } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const INCOME = '#16a34a';
const EXPENSE = '#dc2626';
const BALANCE = '#2563eb';
const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];

const moneyTicks = { ticks: { callback: (v) => `S/ ${Number(v).toLocaleString('en-US')}` }, grid: { color: '#f1f5f9' } };
const moneyTooltip = { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}` } };

export function IncomeExpenseChart({ monthly }) {
  const data = {
    labels: monthly.labels.map(shortMonthLabel),
    datasets: [
      { label: 'Ingresos', data: monthly.income, backgroundColor: INCOME, borderRadius: 6 },
      { label: 'Gastos', data: monthly.expense, backgroundColor: EXPENSE, borderRadius: 6 },
    ],
  };
  return (
    <Bar
      data={data}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: moneyTooltip, legend: { position: 'bottom' } }, scales: { y: moneyTicks, x: { grid: { display: false } } } }}
      aria-label='Gráfico de barras de ingresos versus gastos por mes'
      role='img'
    />
  );
}

export function BalanceChart({ monthly }) {
  const data = {
    labels: monthly.labels.map(shortMonthLabel),
    datasets: [
      { label: 'Balance del mes', data: monthly.balance, borderColor: BALANCE, backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.3 },
      { label: 'Balance acumulado', data: monthly.cumulativeBalance, borderColor: '#0f172a', borderDash: [6, 4], tension: 0.3 },
    ],
  };
  return (
    <Line
      data={data}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: moneyTooltip, legend: { position: 'bottom' } }, scales: { y: { ...moneyTicks, beginAtZero: true }, x: { grid: { display: false } } } }}
      aria-label='Gráfico de líneas con la evolución del balance'
      role='img'
    />
  );
}

/** Distribución de gastos por categoría: el tooltip muestra el monto y el porcentaje del total. */
export function CategoryChart({ distribution }) {
  const items = distribution.items;
  const data = {
    labels: items.map((i) => i.category),
    datasets: [{ data: items.map((i) => i.total), backgroundColor: items.map((_, k) => PALETTE[k % PALETTE.length]), borderWidth: 2 }],
  };
  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'right' },
          tooltip: { callbacks: { label: (ctx) => ` ${formatMoney(items[ctx.dataIndex].total)} (${items[ctx.dataIndex].percent} %)` } },
        },
      }}
      aria-label='Gráfico circular con la distribución de gastos por categoría'
      role='img'
    />
  );
}
