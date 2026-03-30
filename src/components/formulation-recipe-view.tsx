import { useState, useEffect } from 'react';
import { Copy, Check, FlaskConical, ShieldCheck, AlertCircle } from 'lucide-react';
import type { TableConfig } from './workspace-results';

/* ── Ingredient knowledge base ───────────────────────────────── */

interface IngredientDetail {
  smiles: string;
  pubchemCid: number | null; // null = polymer, show placeholder
  category: 'uv-filter' | 'emollient' | 'solvent' | 'stabilizer';
  mw?: string;
  logP?: string;
}

const INGREDIENT_DB: Record<string, IngredientDetail> = {
  'Zinc Oxide (nano)': {
    smiles: '[Zn]=O',
    pubchemCid: 14806,
    category: 'uv-filter',
    mw: '81.38 g/mol',
    logP: '—',
  },
  'Titanium Dioxide': {
    smiles: 'O=[Ti]=O',
    pubchemCid: 26042,
    category: 'uv-filter',
    mw: '79.87 g/mol',
    logP: '—',
  },
  'Avobenzone': {
    smiles: 'CC(C)(C)c1ccc(C(=O)CC(=O)c2ccc(OC)cc2)cc1',
    pubchemCid: 5355130,
    category: 'uv-filter',
    mw: '310.39 g/mol',
    logP: '4.09',
  },
  'Octocrylene': {
    smiles: 'CCCCC(CC)COC(=O)/C(=C\\c1ccccc1)C#N',
    pubchemCid: 6434262,
    category: 'uv-filter',
    mw: '361.48 g/mol',
    logP: '6.88',
  },
  'Cyclopentasiloxane': {
    smiles: 'C[Si]1(C)O[Si](C)(C)O[Si](C)(C)O[Si](C)(C)O[Si](C)(C)O1',
    pubchemCid: 521916,
    category: 'emollient',
    mw: '370.77 g/mol',
    logP: '8.12',
  },
  'Dimethicone': {
    smiles: 'C[Si](C)(C)O[Si](C)(C)O[Si](C)(C)C',
    pubchemCid: 11612,
    category: 'emollient',
    mw: '—',
    logP: '—',
  },
  'Aqua': {
    smiles: 'O',
    pubchemCid: 962,
    category: 'solvent',
    mw: '18.02 g/mol',
    logP: '−1.38',
  },
};

const CATEGORY_COLORS: Record<IngredientDetail['category'], { bg: string; text: string; border: string }> = {
  'uv-filter':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  'emollient':  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'solvent':    { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200'   },
  'stabilizer': { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
};

/* ── Recipe metadata ─────────────────────────────────────────── */

const RECIPE_META: Record<string, { label: string; isLead: boolean; spf: number; wr: string; stability: string; cost: string; score: number; note: string }> = {
  'R-047': { label: 'R-047', isLead: true,  spf: 52.3, wr: '96.8%', stability: '97.0%', cost: '−12%', score: 98.2, note: 'Highest composite score — recommended for wet-lab validation' },
  'R-089': { label: 'R-089', isLead: false, spf: 50.1, wr: '95.2%', stability: '96.5%', cost: '−11%', score: 96.8, note: 'Lower ZnO (14.8%) → improved skin feel and spreadability' },
  'R-124': { label: 'R-124', isLead: false, spf: 51.8, wr: '96.0%', stability: '96.8%', cost: '−9%',  score: 96.4, note: 'Highest ZnO (15.5%) → marginally higher predicted SPF' },
};

/* ── 2D Structure image ──────────────────────────────────────── */

function MoleculeStructure({ cid, smiles, name }: { cid: number | null; smiles: string; name: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setStatus('loading'); }, [smiles]);

  const imgUrl = cid
    ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=200x200`
    : null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(smiles).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-[52px] h-[52px] shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden group shadow-sm">
      {imgUrl && status !== 'error' ? (
        <>
          {status === 'loading' && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
          <img
            src={imgUrl}
            alt={`2D ${name}`}
            className={`w-full h-full object-contain p-0.5 transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <FlaskConical className="w-4 h-4 text-gray-300" />
        </div>
      )}
      {/* Copy SMILES overlay on hover */}
      <button
        onClick={handleCopy}
        title={`Copy SMILES: ${smiles}`}
        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        {copied
          ? <Check className="w-3.5 h-3.5 text-green-400" />
          : <Copy className="w-3.5 h-3.5 text-white" />}
      </button>
    </div>
  );
}

/* ── Compact ingredient row ──────────────────────────────────── */

function IngredientRow({ row, index }: { row: Record<string, any>; index: number }) {
  const detail = INGREDIENT_DB[row.ingredient as string] ?? {
    smiles: 'C',
    pubchemCid: null,
    category: 'emollient' as const,
  };
  const catColor = CATEGORY_COLORS[detail.category];
  const isPass = String(row.status).includes('Pass') || String(row.status).includes('✓');

  const pctNum = parseFloat(String(row.pct));
  const barWidth = Math.min(100, (pctNum / 60) * 100);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all">

      {/* Molecule thumbnail */}
      <MoleculeStructure cid={detail.pubchemCid} smiles={detail.smiles} name={String(row.ingredient)} />

      {/* Name + INCI + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[12px] font-semibold text-gray-900 leading-tight truncate">{row.ingredient}</span>
          <span className={`shrink-0 text-[8px] font-semibold px-1.5 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
            {detail.category === 'uv-filter' ? 'UV' : detail.category === 'emollient' ? 'Emoll.' : detail.category === 'solvent' ? 'Solv.' : 'Stab.'}
          </span>
        </div>
        <div className="text-[9px] text-gray-400 italic truncate">{row.inci}</div>

        {/* % bar */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3F98FF] to-[#7c3aed] transition-all duration-700"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-500 shrink-0">{row.limit}</span>
        </div>
      </div>

      {/* Right: % w/w + compliance */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <div className="text-[16px] font-bold text-gray-900 leading-none">
          {pctNum.toFixed(1)}<span className="text-[10px] font-medium text-gray-400">%</span>
        </div>
        {isPass ? (
          <div className="flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-green-500" />
            <span className="text-[8px] font-semibold text-green-600">OK</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-[8px] font-semibold text-red-500">!</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function FormulationRecipeView({ config, selectedRecipe, onSelectRecipe }: {
  config: TableConfig;
  selectedRecipe?: string;
  onSelectRecipe?: (key: string) => void;
}) {
  // Parse unique recipe names from rows (normalise '★ R-047' → 'R-047')
  const recipeOrder: string[] = [];
  const grouped: Record<string, Record<string, any>[]> = {};
  config.rows.forEach((row) => {
    const raw = String(row.recipe);
    const key = raw.replace(/^[★\s]+/, '').trim();
    if (!grouped[key]) {
      grouped[key] = [];
      recipeOrder.push(key);
    }
    grouped[key].push(row);
  });

  // Use controlled selection if provided, otherwise internal
  const [internalSelected, setInternalSelected] = useState(recipeOrder[0] ?? '');
  const selected = selectedRecipe ?? internalSelected;
  const setSelected = (key: string) => {
    setInternalSelected(key);
    onSelectRecipe?.(key);
  };

  const meta = RECIPE_META[selected];
  const ingredients = grouped[selected] ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Recipe tab selector ───────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white shrink-0 flex-wrap">
        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Recipe</span>
        <div className="flex gap-1.5 flex-wrap">
          {recipeOrder.map((key) => {
            const m = RECIPE_META[key];
            const isActive = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#3F98FF] text-white border-[#3F98FF] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#3F98FF]/40 hover:text-[#3F98FF]'
                }`}
              >
                {m?.isLead && <span>★</span>}
                {key}
                {m?.isLead && (
                  <span className={`text-[8px] px-1 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-[#3F98FF]/10 text-[#3F98FF]'}`}>Lead</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────── */}
      {meta && (
        <div className="shrink-0 bg-gradient-to-r from-[#3F98FF]/5 to-[#7c3aed]/5 border-b border-gray-100 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <div className="flex gap-4 flex-1 flex-wrap">
              {[
                { label: 'Pred. SPF',   value: String(meta.spf),        good: true  },
                { label: 'Water Res.',  value: meta.wr,                  good: true  },
                { label: 'Stability',   value: meta.stability,           good: true  },
                { label: 'Cost Δ',      value: meta.cost,                good: true  },
                { label: 'Score',       value: `${meta.score}/100`,      good: true  },
              ].map(({ label, value, good }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-medium">{label}</span>
                  <span className={`text-[13px] font-bold ${good ? 'text-gray-900' : 'text-red-600'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-1.5 italic">{meta.note}</p>
        </div>
      )}

      {/* ── Ingredient list ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1.5 bg-gray-50/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {ingredients.length} Ingredients
          </span>
          <span className="text-[9px] text-gray-400">
            Total: {ingredients.reduce((s, r) => s + parseFloat(String(r.pct)), 0).toFixed(1)}% w/w
          </span>
        </div>
        {ingredients.map((row, i) => (
          <IngredientRow key={`${selected}-${i}`} row={row} index={i} />
        ))}
      </div>
    </div>
  );
}