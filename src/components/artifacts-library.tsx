import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Package, BarChart3, Table, Atom, Brain, Search, Plus, Clock,
  FlaskConical, TrendingUp, Activity, FileText, ChevronLeft,
  Download, Share2, Hash, Tag, Layers,
  CheckCircle2, AlertTriangle, Info, Maximize2, Database, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

/* ── Types ──────────────────────────────────────────────────── */

export interface LibraryArtifact {
  id: string;
  name: string;
  type: 'chart-bar' | 'chart-line' | 'chart-area' | 'scatter' | 'table' | 'molecule' | 'shap' | 'heatmap' | 'recipe' | 'stats' | 'radar' | 'text';
  timestamp: string;
  category: string;
  size?: string;
  pinned?: boolean;
}

interface ArtifactsLibraryProps {
  artifacts: LibraryArtifact[];
  onAddToCanvas: (artifactId: string) => void;
}

/* ── Icon / colour maps ────────────────────────────────────── */

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'chart-bar':  <BarChart3     className="w-3 h-3" />,
  'chart-line': <Activity      className="w-3 h-3" />,
  'chart-area': <TrendingUp    className="w-3 h-3" />,
  'scatter':    <TrendingUp    className="w-3 h-3" />,
  'table':      <Table         className="w-3 h-3" />,
  'molecule':   <Atom          className="w-3 h-3" />,
  'shap':       <Brain         className="w-3 h-3" />,
  'heatmap':    <BarChart3     className="w-3 h-3" />,
  'recipe':     <FlaskConical  className="w-3 h-3" />,
  'stats':      <TrendingUp    className="w-3 h-3" />,
  'radar':      <Activity      className="w-3 h-3" />,
  'text':       <FileText      className="w-3 h-3" />,
};

const TYPE_COLORS: Record<string, string> = {
  'chart-bar':  'text-blue-600 bg-blue-50',
  'chart-line': 'text-purple-600 bg-purple-50',
  'chart-area': 'text-teal-600 bg-teal-50',
  'scatter':    'text-orange-600 bg-orange-50',
  'table':      'text-gray-600 bg-gray-100',
  'molecule':   'text-indigo-600 bg-indigo-50',
  'shap':       'text-violet-600 bg-violet-50',
  'heatmap':    'text-rose-600 bg-rose-50',
  'recipe':     'text-green-600 bg-green-50',
  'stats':      'text-cyan-600 bg-cyan-50',
  'radar':      'text-pink-600 bg-pink-50',
  'text':       'text-amber-600 bg-amber-50',
};

const TYPE_LABEL: Record<string, string> = {
  'chart-bar':  'Bar Chart',
  'chart-line': 'Line Chart',
  'chart-area': 'Area Chart',
  'scatter':    'Scatter Plot',
  'table':      'Data Table',
  'molecule':   'Molecule',
  'shap':       'SHAP Analysis',
  'heatmap':    'Heatmap',
  'recipe':     'Recipe',
  'stats':      'Model Stats',
  'radar':      'Radar Chart',
  'text':       'Document',
};

const CATEGORIES = ['All', 'Analysis', 'Models', 'Data', 'Recipes', 'Reports'];

/* ── Navigation map: artifact id → destination ──────────────── */

const ARTIFACT_NAV_MAP: Record<string, { path: string; selectedId?: string; label: string }> = {
  'lib-1': { path: '/analysis',  label: 'Analysis' },
  'lib-2': { path: '/datasets',  selectedId: 'ds-1', label: 'Datasets' },
  'lib-3': { path: '/datasets',  selectedId: 'ds-1', label: 'Datasets' },
  'lib-4': { path: '/datasets',  selectedId: 'ds-1', label: 'Datasets' },
  'lib-5': { path: '/analysis',  label: 'Analysis' },
  'lib-6': { path: '/reports',   label: 'Reports' },
  'lib-7': { path: '/datasets',  selectedId: 'ds-2', label: 'Datasets' },
  'lib-8': { path: '/models',    selectedId: 'mdl-2', label: 'Models' },
  'lib-9': { path: '/analysis',  label: 'Analysis' },
};

/* ── Mock detail content per artifact ───────────────────────── */

const ARTIFACT_DETAILS: Record<string, {
  description: string;
  tags: string[];
  properties: { label: string; value: string }[];
  preview: React.ReactNode;
}> = {
  'lib-1': {
    description: 'Pearson correlation matrix across all 18 formulation features. Highlights strong positive correlation between zinc oxide concentration and SPF (r=0.82).',
    tags: ['correlation', 'heatmap', 'features', 'SPF'],
    properties: [
      { label: 'Dimensions',   value: '18 × 18 features' },
      { label: 'Method',       value: 'Pearson r' },
      { label: 'Samples',      value: '2,450 formulations' },
      { label: 'Highest corr', value: 'ZnO ↔ SPF (r=0.82)' },
    ],
    preview: (
      <div className="w-full">
        <div className="text-[10px] text-gray-400 mb-2 font-medium">Top Feature Correlations with SPF</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={[
            { name: 'ZnO',       r: 0.82 },
            { name: 'TiO₂',     r: 0.71 },
            { name: 'Octocryl', r: 0.58 },
            { name: 'Emollient',r: -0.35 },
            { name: 'Water',    r: -0.18 },
          ]} layout="vertical" margin={{ top: 0, right: 12, left: 40, bottom: 0 }}>
            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={50} />
            <Tooltip formatter={(v: number) => v.toFixed(2)} />
            <Bar dataKey="r" radius={[0, 3, 3, 0]}>
              {[0.82, 0.71, 0.58, -0.35, -0.18].map((v, i) => (
                <Cell key={`cell-lib1-${i}`} fill={v >= 0 ? '#3F98FF' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
  },
  'lib-2': {
    description: 'Full historical formulation dataset spanning 6 years of R&D. Includes raw ingredient percentages, batch IDs, SPF measurements, and stability outcomes.',
    tags: ['historical', 'formulations', 'raw-data', 'SPF'],
    properties: [
      { label: 'Rows',       value: '2,450' },
      { label: 'Columns',    value: '24' },
      { label: 'Date range', value: '2018 – 2024' },
      { label: 'Format',     value: 'CSV / Parquet' },
    ],
    preview: (
      <div className="w-full overflow-x-auto">
        <div className="text-[10px] text-gray-400 mb-2 font-medium">Sample rows</div>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {['Batch', 'ZnO %', 'TiO₂ %', 'SPF', 'Status'].map(h => (
                <th key={h} className="px-2 py-1 text-left text-gray-500 font-semibold border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['B-2418', '12.0', '5.5', '48.2', '✓'],
              ['B-2417', '10.5', '6.0', '44.8', '✓'],
              ['B-2416', '8.0',  '7.0', '38.1', '✗'],
              ['B-2415', '14.0', '4.5', '51.3', '✓'],
            ].map((row, i) => (
              <tr key={`row-lib2-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={`cell-lib2-${i}-${j}`} className={`px-2 py-1 ${j === 4 ? (cell === '✓' ? 'text-green-600' : 'text-red-500') : 'text-gray-700'}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[9px] text-gray-400 mt-1">… 2,446 more rows</div>
      </div>
    ),
  },
  'lib-3': {
    description: 'Chemical structure of Avobenzone (Butyl Methoxydibenzoylmethane), a broad-spectrum UVA filter commonly used in sunscreen formulations.',
    tags: ['UVA filter', 'organic', 'sunscreen', 'photostable'],
    properties: [
      { label: 'CAS No.',    value: '70356-09-1' },
      { label: 'Formula',    value: 'C₂₀H₂₂O₃' },
      { label: 'MW',         value: '310.39 g/mol' },
      { label: 'Max λ (abs)',value: '357 nm (UVA)' },
    ],
    preview: (
      <div className="w-full">
        <div className="text-[10px] text-gray-400 mb-2 font-medium">UV Absorbance Spectrum (simulated)</div>
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={[280,300,320,340,357,370,380,400].map((nm, i) => ({
            nm, abs: [0.12, 0.28, 0.55, 0.88, 1.0, 0.74, 0.42, 0.08][i]
          }))} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="nm" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} domain={[0, 1.1]} />
            <Line type="monotone" dataKey="abs" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 bg-indigo-50 rounded px-2 py-1.5 text-[10px] text-indigo-700 font-mono leading-relaxed">
          C(=O)(c1ccccc1)C(=O)CCCC · UVA absorber · logP = 5.1
        </div>
      </div>
    ),
  },
  'lib-4': {
    description: 'Zinc Oxide nanoparticles used as an inorganic UV filter. Broad-spectrum UVA/UVB coverage with excellent photostability.',
    tags: ['UVA', 'UVB', 'inorganic', 'nanoparticle', 'photostable'],
    properties: [
      { label: 'CAS No.',    value: '1314-13-2' },
      { label: 'Formula',    value: 'ZnO' },
      { label: 'MW',         value: '81.38 g/mol' },
      { label: 'Particle Ø', value: '20–50 nm' },
    ],
    preview: (
      <div className="space-y-2">
        <div className="text-[10px] text-gray-400 font-medium">UV Protection Range</div>
        <div className="flex gap-2">
          {[['UVB 290–320nm', '#3F98FF', '88%'], ['UVA 320–400nm', '#7c3aed', '76%']].map(([label, color, pct]) => (
            <div key={label as string} className="flex-1 rounded-lg p-2 border border-gray-100 bg-gray-50">
              <div className="text-[10px] text-gray-600 mb-1">{label}</div>
              <div className="text-[13px] font-bold" style={{ color: color as string }}>{pct}</div>
              <div className="mt-1 h-1 rounded-full bg-gray-200">
                <div className="h-1 rounded-full" style={{ width: pct, backgroundColor: color as string }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 rounded px-2 py-1.5 text-[10px] text-amber-700">
          ⚡ Photostable — does not degrade under UV exposure
        </div>
      </div>
    ),
  },
  'lib-5': {
    description: 'Bar chart comparing cost per kg vs. predicted SPF performance across candidate formulations. Identifies the Pareto-optimal cost-performance frontier.',
    tags: ['cost', 'performance', 'Pareto', 'SPF'],
    properties: [
      { label: 'X-axis',    value: 'Cost per kg (USD)' },
      { label: 'Y-axis',    value: 'Predicted SPF' },
      { label: 'Samples',   value: '12 candidates' },
      { label: 'Lead',      value: 'R-047 ($18.40/kg, SPF 52)' },
    ],
    preview: (
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={[
          { id: 'R-047', spf: 52.3 },
          { id: 'R-089', spf: 50.1 },
          { id: 'R-124', spf: 51.8 },
          { id: 'R-031', spf: 44.6 },
          { id: 'R-072', spf: 41.2 },
        ]} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis dataKey="id" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
          <Tooltip />
          <Bar dataKey="spf" name="Pred. SPF" radius={[3, 3, 0, 0]}>
            {['R-047','R-089','R-124','R-031','R-072'].map((id, i) => (
              <Cell key={`cell-lib5-${id}`} fill={i === 0 ? '#3F98FF' : '#93c5fd'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  'lib-6': {
    description: 'EU Regulation (EC) No 1223/2009 summary for cosmetic sunscreens. Key restrictions, approved UV filter list, and maximum permitted concentrations.',
    tags: ['regulatory', 'EU', 'compliance', 'UV filters'],
    properties: [
      { label: 'Regulation',  value: 'EC 1223/2009 + Annex VI' },
      { label: 'Region',      value: 'European Union' },
      { label: 'Last updated',value: 'Oct 2024' },
      { label: 'Status',      value: '✓ Compliant' },
    ],
    preview: (
      <div className="space-y-2">
        <div className="text-[10px] text-gray-400 font-medium">Key Concentration Limits</div>
        {[
          { name: 'Zinc Oxide (nano)', limit: '≤ 25%', status: 'ok', current: '12%' },
          { name: 'Avobenzone',       limit: '≤ 5%',  status: 'ok', current: '3%'  },
          { name: 'Octinoxate',       limit: '≤ 10%', status: 'ok', current: '7.5%'},
          { name: 'Oxybenzone',       limit: '≤ 10%', status: 'warn', current: '—' },
        ].map((r) => (
          <div key={r.name} className="flex items-center gap-2 text-[10px]">
            {r.status === 'ok'
              ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              : <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            }
            <span className="flex-1 text-gray-700">{r.name}</span>
            <span className="text-gray-400">{r.limit}</span>
            <span className={`font-medium ${r.status === 'ok' ? 'text-green-600' : 'text-amber-600'}`}>{r.current}</span>
          </div>
        ))}
      </div>
    ),
  },
  'lib-7': {
    description: 'CMC (Critical Micelle Concentration) measurements for 42 surfactant candidates used in the formulation pipeline.',
    tags: ['surfactant', 'CMC', 'emulsification', 'dataset'],
    properties: [
      { label: 'Rows',      value: '1,820' },
      { label: 'Columns',   value: '16' },
      { label: 'Surfactants','value': '42 types' },
      { label: 'Format',    value: 'CSV' },
    ],
    preview: (
      <div>
        <div className="text-[10px] text-gray-400 mb-2 font-medium">CMC Distribution by Type</div>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={[
            { type: 'Anionic',    avg: 0.24 },
            { type: 'Cationic',  avg: 0.41 },
            { type: 'Nonionic',  avg: 0.08 },
            { type: 'Amphoteric',avg: 0.19 },
          ]} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="type" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} unit=" mM" />
            <Tooltip formatter={(v: number) => `${v} mM`} />
            <Bar dataKey="avg" name="Avg CMC" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
  },
  'lib-8': {
    description: 'Performance metrics for SPF-XGB-Ensemble v2.0, the predecessor model trained on an earlier dataset before the 2024 expansion.',
    tags: ['model', 'XGBoost', 'v2', 'SPF', 'performance'],
    properties: [
      { label: 'Model',      value: 'SPF-XGB-Ensemble v2.0' },
      { label: 'R² (test)',  value: '0.871' },
      { label: 'RMSE',       value: '1.94' },
      { label: 'Train size', value: '1,240 samples' },
    ],
    preview: (
      <div className="space-y-2">
        <div className="text-[10px] text-gray-400 font-medium">v2 vs v3 Performance</div>
        {[
          { metric: 'R² Score',  v2: 0.871, v3: 0.924 },
          { metric: 'RMSE',      v2: 1.94,  v3: 1.52  },
          { metric: 'MAE',       v2: 1.42,  v3: 1.11  },
        ].map((m) => (
          <div key={m.metric} className="text-[10px]">
            <div className="flex justify-between text-gray-500 mb-0.5">
              <span>{m.metric}</span>
              <span className="text-green-600 font-medium">+{((m.v3 - m.v2) / m.v2 * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(m.v2) * 100}%` }} />
              </div>
              <span className="text-gray-500 w-8 text-right">{m.v2}</span>
            </div>
            <div className="flex gap-1 items-center mt-0.5">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3F98FF] rounded-full" style={{ width: `${(m.v3) * 100}%` }} />
              </div>
              <span className="text-[#3F98FF] font-semibold w-8 text-right">{m.v3}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  'lib-9': {
    description: 'SPF performance over increasing emollient concentration across 5 emollient types. Shows the dilution effect on UV filter efficacy.',
    tags: ['emollient', 'SPF', 'dilution', 'trend'],
    properties: [
      { label: 'X-axis',   value: 'Emollient conc. (%)' },
      { label: 'Y-axis',   value: 'Predicted SPF' },
      { label: 'Emollients','value': '5 types' },
      { label: 'Key finding','value': 'SPF −0.35/% emollient' },
    ],
    preview: (
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={[2,4,6,8,10,12,14].map((pct) => ({
          pct,
          'Isopropyl': 52 - pct * 0.8,
          'Caprylic':  50 - pct * 0.6,
          'Cyclopent': 48 - pct * 1.1,
        }))} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis dataKey="pct" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={26} domain={[34, 54]} />
          <Tooltip />
          <Line type="monotone" dataKey="Isopropyl" stroke="#3F98FF" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Caprylic"  stroke="#7c3aed" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Cyclopent" stroke="#059669" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
};

type ArtifactTableSpec = {
  title: string;
  subtitle: string;
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>;
  rows: Array<Record<string, string | number>>;
};

function parseArtifactRowCount(size?: string): number | null {
  if (!size) return null;
  const match = size.match(/[\d,]+/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function buildFullRows(artifactId: string, seedRows: Array<Record<string, string | number>>, targetCount: number) {
  if (seedRows.length >= targetCount) return seedRows.slice(0, targetCount);

  const rows: Array<Record<string, string | number>> = [];

  for (let index = 0; index < targetCount; index += 1) {
    const base = seedRows[index % seedRows.length];

    if (artifactId === 'lib-2') {
      const batchNum = 2418 - index;
      const batchLabel = `B-${batchNum > 0 ? batchNum : Math.abs(batchNum) + 1000}`;

      const znoBase = Number(base.zno ?? 10);
      const tio2Base = Number(base.tio2 ?? 5);
      const spfBase = Number(base.spf ?? 40);
      const wrBase = Number(base.wr ?? 85);

      const zno = Math.max(6, Math.min(16, +(znoBase + ((index % 7) - 3) * 0.15).toFixed(1)));
      const tio2 = Math.max(3, Math.min(10, +(tio2Base + ((index % 5) - 2) * 0.12).toFixed(1)));
      const spf = +(spfBase + ((index % 9) - 4) * 0.35).toFixed(1);
      const wr = +(wrBase + ((index % 11) - 5) * 0.3).toFixed(1);

      rows.push({
        batch: batchLabel,
        zno,
        tio2,
        spf,
        wr,
        status: spf >= 40 && wr >= 84 ? 'Pass' : 'Fail',
      });
      continue;
    }

    if (artifactId === 'lib-7') {
      const idLabel = `S-${String(index + 1).padStart(3, '0')}`;
      const types = ['Anionic', 'Cationic', 'Nonionic', 'Amphoteric'];
      const type = types[index % types.length];
      const cmcBase = Number(base.cmc ?? 0.2);
      const phBase = Number(base.ph ?? 6.8);
      const tempBase = Number(base.temp ?? 25);

      const cmc = +(cmcBase + ((index % 13) - 6) * 0.005).toFixed(2);
      const ph = +(phBase + ((index % 9) - 4) * 0.03).toFixed(1);
      const temp = [20, 25, 30, 35][index % 4] ?? tempBase;

      rows.push({
        id: idLabel,
        type,
        cmc,
        ph,
        temp,
        quality: cmc <= 0.28 ? 'A' : 'B',
      });
      continue;
    }

    rows.push(base);
  }

  return rows;
}

const ARTIFACT_TABLE_DATA: Record<string, ArtifactTableSpec> = {
  'lib-2': {
    title: 'Historical Formulations Table',
    subtitle: '2,450 rows · sample shown',
    columns: [
      { key: 'batch', label: 'Batch' },
      { key: 'zno', label: 'ZnO %', align: 'right' },
      { key: 'tio2', label: 'TiO₂ %', align: 'right' },
      { key: 'spf', label: 'SPF', align: 'right' },
      { key: 'wr', label: 'WR %', align: 'right' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    rows: [
      { batch: 'B-2418', zno: 12.0, tio2: 5.5, spf: 48.2, wr: 91.4, status: 'Pass' },
      { batch: 'B-2417', zno: 10.5, tio2: 6.0, spf: 44.8, wr: 87.2, status: 'Pass' },
      { batch: 'B-2416', zno: 8.0, tio2: 7.0, spf: 38.1, wr: 81.6, status: 'Fail' },
      { batch: 'B-2415', zno: 14.0, tio2: 4.5, spf: 51.3, wr: 93.1, status: 'Pass' },
      { batch: 'B-2414', zno: 13.2, tio2: 4.8, spf: 49.7, wr: 92.5, status: 'Pass' },
      { batch: 'B-2413', zno: 9.7, tio2: 6.4, spf: 41.9, wr: 85.8, status: 'Pass' },
      { batch: 'B-2412', zno: 7.5, tio2: 7.8, spf: 36.2, wr: 79.9, status: 'Fail' },
      { batch: 'B-2411', zno: 11.8, tio2: 5.1, spf: 46.8, wr: 90.4, status: 'Pass' },
      { batch: 'B-2410', zno: 15.1, tio2: 3.9, spf: 53.0, wr: 95.2, status: 'Pass' },
      { batch: 'B-2409', zno: 10.9, tio2: 5.8, spf: 45.4, wr: 88.0, status: 'Pass' },
    ],
  },
  'lib-7': {
    title: 'Surfactant CMC Dataset',
    subtitle: '1,820 rows · sample shown',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'type', label: 'Type' },
      { key: 'cmc', label: 'CMC (mM)', align: 'right' },
      { key: 'ph', label: 'pH', align: 'right' },
      { key: 'temp', label: 'Temp (°C)', align: 'right' },
      { key: 'quality', label: 'Quality', align: 'center' },
    ],
    rows: [
      { id: 'S-001', type: 'Anionic', cmc: 0.24, ph: 6.8, temp: 25, quality: 'A' },
      { id: 'S-002', type: 'Cationic', cmc: 0.41, ph: 6.2, temp: 25, quality: 'B' },
      { id: 'S-003', type: 'Nonionic', cmc: 0.08, ph: 7.0, temp: 25, quality: 'A' },
      { id: 'S-004', type: 'Amphoteric', cmc: 0.19, ph: 6.5, temp: 30, quality: 'A' },
      { id: 'S-005', type: 'Anionic', cmc: 0.27, ph: 6.9, temp: 25, quality: 'B' },
      { id: 'S-006', type: 'Cationic', cmc: 0.38, ph: 6.1, temp: 30, quality: 'B' },
      { id: 'S-007', type: 'Nonionic', cmc: 0.09, ph: 7.1, temp: 25, quality: 'A' },
      { id: 'S-008', type: 'Amphoteric', cmc: 0.21, ph: 6.6, temp: 35, quality: 'A' },
      { id: 'S-009', type: 'Anionic', cmc: 0.26, ph: 6.7, temp: 25, quality: 'A' },
      { id: 'S-010', type: 'Nonionic', cmc: 0.07, ph: 7.0, temp: 30, quality: 'A' },
    ],
  },
};

function ArtifactDataTable({ artifact, data, isExpanded }: { artifact: LibraryArtifact; data: ArtifactTableSpec; isExpanded?: boolean }) {
  const getAlignClass = (align?: 'left' | 'right' | 'center') => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(420);

  const targetRowCount = parseArtifactRowCount(artifact.size) ?? data.rows.length;
  const fullRows = useMemo(
    () => buildFullRows(artifact.id, data.rows, targetRowCount),
    [artifact.id, data.rows, targetRowCount],
  );

  const ROW_HEIGHT = 33;
  const OVERSCAN = 12;
  const useVirtualization = fullRows.length > 180;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => setViewportHeight(el.clientHeight || 420);
    updateHeight();

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const visibleCount = Math.max(1, Math.ceil(viewportHeight / ROW_HEIGHT));
  const startIndex = useVirtualization
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    : 0;
  const endIndex = useVirtualization
    ? Math.min(fullRows.length, startIndex + visibleCount + OVERSCAN * 2)
    : fullRows.length;

  const visibleRows = useVirtualization ? fullRows.slice(startIndex, endIndex) : fullRows;
  const topSpacerHeight = useVirtualization ? startIndex * ROW_HEIGHT : 0;
  const bottomSpacerHeight = useVirtualization ? Math.max(0, (fullRows.length - endIndex) * ROW_HEIGHT) : 0;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="text-[12px] font-semibold text-gray-900">{data.title}</div>
        <div className="text-[10px] text-gray-400">{targetRowCount.toLocaleString()} rows · {artifact.timestamp}</div>
      </div>

      <div className="flex-1 min-h-0 px-3 pt-2 overflow-hidden">
        <div
          ref={containerRef}
          className={`h-full overflow-auto rounded-md border border-gray-100 ${isExpanded ? 'max-h-full' : 'max-h-[520px]'}`}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
        <table className="w-full border-separate border-spacing-0 text-[10px]">
          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr>
              {data.columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-2.5 py-2 border-b border-gray-200 text-[9px] uppercase tracking-wide font-semibold text-gray-500 ${getAlignClass(column.align)}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={data.columns.length} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }} />
              </tr>
            )}

            {visibleRows.map((row, visibleRowIdx) => {
              const rowIdx = startIndex + visibleRowIdx;
              return (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/35 hover:bg-gray-50'}>
                {data.columns.map((column) => {
                  const value = row[column.key];
                  const statusCell = column.key === 'status';
                  const qualityCell = column.key === 'quality';

                  return (
                    <td
                      key={`${rowIdx}-${column.key}`}
                      className={`px-2.5 py-2 border-b border-gray-100 text-gray-700 whitespace-nowrap ${getAlignClass(column.align)}`}
                    >
                      {statusCell ? (
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${String(value) === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {String(value)}
                        </span>
                      ) : qualityCell ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-600">
                          {String(value)}
                        </span>
                      ) : (
                        <span>{value}</span>
                      )}
                    </td>
                  );
                })}
                </tr>
              );
            })}

            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={data.columns.length} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ── Detail panel ───────────────────────────────────────────── */

function ArtifactDetail({ artifact, onBack, onAddToCanvas }: {
  artifact: LibraryArtifact;
  onBack: () => void;
  onAddToCanvas: (id: string) => void;
}) {
  const detail = ARTIFACT_DETAILS[artifact.id];
  const colorCls = TYPE_COLORS[artifact.type] || 'text-gray-600 bg-gray-100';
  const navigate = useNavigate();
  const navTarget = ARTIFACT_NAV_MAP[artifact.id];

  const handleGoToAsset = () => {
    if (!navTarget) return;
    navigate(navTarget.path, {
      state: navTarget.selectedId
        ? { selectedId: navTarget.selectedId, expandedId: navTarget.selectedId }
        : undefined,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Back header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Library
        </button>
        <span className="text-gray-300 text-xs">/</span>
        <span className="text-[11px] text-gray-700 font-semibold truncate">{artifact.name}</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
              <div className="scale-125">{TYPE_ICONS[artifact.type]}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-900 leading-snug">{artifact.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colorCls}`}>
                  {TYPE_LABEL[artifact.type] || artifact.type}
                </span>
                <span className="text-[10px] text-gray-400">{artifact.category}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={handleGoToAsset}
              disabled={!navTarget}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#3F98FF] text-white text-[11px] font-semibold rounded-md hover:bg-[#2d87ee] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-3 h-3" />
              Go to asset{navTarget ? ` · ${navTarget.label}` : ''}
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {detail?.description && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">{detail.description}</p>
          </div>
        )}

        {/* Preview */}
        {detail?.preview && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Maximize2 className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Preview</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              {detail.preview}
            </div>
          </div>
        )}

        {/* Properties */}
        {detail?.properties && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Properties</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {detail.properties.map((p) => (
                <div key={p.label}>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{p.label}</div>
                  <div className="text-[11px] font-semibold text-gray-800">{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {detail?.tags && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detail.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Metadata</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px]">
              <Clock className="w-3 h-3 text-gray-300 shrink-0" />
              <span className="text-gray-500">Created</span>
              <span className="ml-auto text-gray-700 font-medium">{artifact.timestamp}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <Hash className="w-3 h-3 text-gray-300 shrink-0" />
              <span className="text-gray-500">ID</span>
              <span className="ml-auto text-gray-700 font-mono">{artifact.id}</span>
            </div>
            {artifact.size && (
              <div className="flex items-center gap-2 text-[10px]">
                <Database className="w-3 h-3 text-gray-300 shrink-0" />
                <span className="text-gray-500">Size</span>
                <span className="ml-auto text-gray-700 font-medium">{artifact.size}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Embeddable panel view (used by workspace panels) ────────── */

export function ArtifactPanelEmbed({ artifact, isExpanded }: { artifact: LibraryArtifact; isExpanded?: boolean }) {
  const detail = ARTIFACT_DETAILS[artifact.id];
  const colorCls = TYPE_COLORS[artifact.type] || 'text-gray-600 bg-gray-100';
  const tableData = artifact.type === 'table' ? ARTIFACT_TABLE_DATA[artifact.id] : null;

  if (tableData) {
    return <ArtifactDataTable artifact={artifact} data={tableData} isExpanded={isExpanded} />;
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Hero header */}
      <div className="shrink-0 px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
            <div className="scale-125">{TYPE_ICONS[artifact.type]}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-gray-900 leading-snug truncate">{artifact.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colorCls}`}>
                {TYPE_LABEL[artifact.type] || artifact.type}
              </span>
              <span className="text-[10px] text-gray-400">{artifact.category}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">{artifact.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        {detail?.description && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">{detail.description}</p>
          </div>
        )}

        {/* Preview */}
        {detail?.preview && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Maximize2 className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Preview</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              {detail.preview}
            </div>
          </div>
        )}

        {/* Properties */}
        {detail?.properties && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Properties</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {detail.properties.map((p) => (
                <div key={p.label}>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{p.label}</div>
                  <div className="text-[11px] font-semibold text-gray-800">{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {detail?.tags && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detail.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export function ArtifactsLibrary({ artifacts, onAddToCanvas }: ArtifactsLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArtifact, setSelectedArtifact] = useState<LibraryArtifact | null>(null);

  const filtered = artifacts.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, LibraryArtifact[]>);

  /* Detail view */
  if (selectedArtifact) {
    return (
      <ArtifactDetail
        artifact={selectedArtifact}
        onBack={() => setSelectedArtifact(null)}
        onAddToCanvas={(id) => { onAddToCanvas(id); setSelectedArtifact(null); }}
      />
    );
  }

  /* List view */
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-[#3F98FF]/10 rounded flex items-center justify-center">
            <Package className="w-3 h-3 text-[#3F98FF]" />
          </div>
          <span className="text-[11px] font-bold text-gray-900">Artifact Library</span>
          <span className="ml-auto text-[10px] text-gray-400">{artifacts.length} items</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search artifacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3F98FF] focus:border-[#3F98FF]"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-2 py-1.5 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {CATEGORIES.filter(cat => cat === 'All' || artifacts.some(a => a.category === cat)).map(cat => (
            <button
              key={cat}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#3F98FF] text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Artifact list */}
      <div className="flex-1 overflow-auto">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center px-3">
            <p className="text-[11px] text-gray-400">No artifacts found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1 bg-gray-50 border-y border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-600">{category}</span>
                <span className="text-[9px] text-gray-400">{items.length}</span>
              </div>
              <div className="px-1 py-1">
                {items.map(artifact => (
                  <div
                    key={artifact.id}
                    className="group flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50/60 rounded-md cursor-pointer transition-colors"
                    onClick={() => setSelectedArtifact(artifact)}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${TYPE_COLORS[artifact.type] || 'text-gray-600 bg-gray-100'}`}>
                      {TYPE_ICONS[artifact.type] || <FileText className="w-3 h-3" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-800 truncate">{artifact.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-[9px] text-gray-400">{artifact.timestamp}</span>
                        {artifact.size && <span className="text-[9px] text-gray-300">· {artifact.size}</span>}
                      </div>
                    </div>
                    {/* Go to asset — opens detail view */}
                    <button
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#3F98FF]/10 text-[#3F98FF] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#3F98FF]/20 shrink-0 text-[10px] font-semibold whitespace-nowrap"
                      onClick={e => { e.stopPropagation(); setSelectedArtifact(artifact); }}
                      title="Go to asset"
                    >
                      Go to asset
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}