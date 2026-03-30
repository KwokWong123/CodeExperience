import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, FolderOpen, FlaskConical,
  BrainCircuit, Database, Target, TrendingUp, TrendingDown,
  ShieldCheck, SlidersHorizontal, CheckCircle2, Clock,
  AlertCircle, Lock, Plus, X, Edit2, Check, Eye, GitBranch,
  Beaker, RotateCcw, Loader2, ArrowRight, Hash, Repeat2,
  Shuffle, Minus, Play, Zap,
} from 'lucide-react';
import { DatasetViewerModal, DatasetInfo } from './dataset-viewer-modal';
import { InsightsPanel, Insight, ModelMetrics } from './insights-panel';
import { Brain } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */

export interface Objective {
  id: string;
  attribute: string;
  target: 'maximize' | 'minimize' | 'range';
  value?: number | string;
  unit?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'achieved' | 'pending' | 'at-risk';
  progress?: number;
  currentValue?: number | string;
}

export interface Constraint {
  id: string;
  ingredient: string;
  min?: number;
  max?: number;
  unit: string;
  type: 'regulatory' | 'process' | 'cost';
}

interface WorkspaceConfig {
  projectId: string;
  experimentType: string;
  modelId: string;
  modelVersion: string;
}

interface WorkspaceConfigPanelProps {
  objectives: Objective[];
  isLocked?: boolean;
  recipesGenerated?: boolean;
  isGenerating?: boolean;
  onGenerate?: () => void;
  insights?: Insight[];
  modelMetrics?: ModelMetrics | null;
  projectId?: string;
  modelId?: string;
  modelVersion?: string;
  onModelProjectChange?: (projectId: string, modelId: string, modelVersion: string) => void;
  objectiveWeights?: Record<string, number>;
  onWeightsChange?: (weights: Record<string, number>) => void;
  onWeightChange?: (id: string, val: number) => void;
  onObjectivesChange?: (objectives: Objective[], weights: Record<string, number>) => void;
  onConstraintsChange?: (constraints: Constraint[]) => void;
}

interface ModelVersionEntry {
  version: string;
  date: string;
  r2: number | null;
  rmse: number | null;
  trainSamples: number;
  notes: string;
  status: 'deployed' | 'staging' | 'training' | 'archived';
}

interface ModelEntry {
  id: string;
  label: string;
  type: string;
  features: number;
  project: string;
  datasetId: string;
  defaultVersion: string;
  versions: ModelVersionEntry[];
}

/* ── Sweep / Forward prediction types ─────────────────────── */

interface SweepParam {
  id: string;
  field: string;
  min: number;
  max: number;
  steps: number;
}

type RemainingStrategy = 'mean' | 'custom' | 'randomize' | 'baseline';

interface ForwardInputField {
  field: string;
  label: string;
  value: string;
  unit: string;
  min: number;
  max: number;
  type: 'number' | 'categorical';
  options?: string[];
}

interface PredictionResult {
  spf: number;
  wr: number;
  stability12m: number;
  stability24m: number;
  confidence: number;
}

/* ── Static options ─────────────────────────────────────────── */

export const PROJECTS = [
  { id: '1', name: 'Sunscreen SPF Optimization', status: 'active' },
  { id: '2', name: 'Surfactant CMC Prediction', status: 'complete' },
  { id: '3', name: 'Emollient Texture Analysis', status: 'draft' },
  { id: '4', name: 'UV Filter Photo-Stability', status: 'draft' },
  { id: '5', name: 'Transdermal Penetration', status: 'draft' },
];

const EXPERIMENT_TYPES = [
  { id: 'doe',     label: 'Design of Experiments', icon: '🧪' },
  { id: 'sweep',   label: 'Parameter Sweep',        icon: '🔁' },
  { id: 'inverse', label: 'Inverse Design',         icon: '🎯' },
];

export const MODELS: ModelEntry[] = [
  {
    id: 'mdl-1', label: 'SPF-XGB-Ensemble', type: 'XGBoost + Random Forest',
    features: 18, project: 'Sunscreen SPF Optimization', datasetId: 'ds-1',
    defaultVersion: 'v3.0',
    versions: [
      { version: 'v3.0', date: 'Mar 14, 2026', r2: 0.940, rmse: 2.31, trainSamples: 1957, status: 'deployed', notes: 'Added RF ensemble; +329 new lab runs' },
      { version: 'v2.1', date: 'Mar 12, 2026', r2: 0.921, rmse: 2.89, trainSamples: 1628, status: 'staging',  notes: 'Grid search HPO; +428 formulations' },
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.903, rmse: 3.42, trainSamples: 1200, status: 'archived', notes: 'Initial XGBoost baseline' },
    ],
  },
  {
    id: 'mdl-2', label: 'CMC-GP-Predictor', type: 'Gaussian Process',
    features: 12, project: 'Surfactant CMC Prediction', datasetId: 'ds-2',
    defaultVersion: 'v1.2',
    versions: [
      { version: 'v1.2', date: 'Feb 28, 2026', r2: 0.887, rmse: 0.24, trainSamples: 1456, status: 'deployed', notes: 'RBF+WhiteKernel; +280 literature entries' },
      { version: 'v1.1', date: 'Feb 20, 2026', r2: 0.871, rmse: 0.31, trainSamples: 1176, status: 'archived', notes: 'Matérn kernel; +300 ionic surfactants' },
      { version: 'v1.0', date: 'Feb 12, 2026', r2: 0.842, rmse: 0.44, trainSamples: 876,  status: 'archived', notes: 'Baseline GP, default kernel' },
    ],
  },
  {
    id: 'mdl-3', label: 'Texture-LGBM', type: 'LightGBM',
    features: 22, project: 'Emollient Texture Analysis', datasetId: 'ds-3',
    defaultVersion: 'v1.0',
    versions: [
      { version: 'v1.0', date: 'Feb 22, 2026', r2: 0.912, rmse: 0.42, trainSamples: 356, status: 'staging', notes: 'Initial multi-output model; awaiting HPO v2' },
    ],
  },
  {
    id: 'mdl-4', label: 'UV-DegradationXGB', type: 'XGBoost',
    features: 16, project: 'UV Filter Photo-Stability', datasetId: 'ds-4',
    defaultVersion: 'v0.5-beta',
    versions: [
      { version: 'v0.5-beta', date: 'Mar 15, 2026', r2: null, rmse: null, trainSamples: 714, status: 'training', notes: 'Training with 5-fold CV — ETA 22 min' },
    ],
  },
  {
    id: 'mdl-5', label: 'SPF-Ridge-Baseline', type: 'Ridge Regression',
    features: 18, project: 'Sunscreen SPF Optimization', datasetId: 'ds-1',
    defaultVersion: 'v1.0',
    versions: [
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.724, rmse: 5.18, trainSamples: 1957, status: 'archived', notes: 'Linear baseline — archived after XGB outperformed' },
    ],
  },
];

export const MODEL_STATUS_CONFIG: Record<string, { dot: string; label: string; color: string; bg: string }> = {
  deployed: { dot: 'bg-green-500',               label: 'Deployed', color: 'text-green-700', bg: 'bg-green-50'  },
  staging:  { dot: 'bg-blue-400',                label: 'Staging',  color: 'text-[#3F98FF]', bg: 'bg-blue-50'   },
  training: { dot: 'bg-amber-400 animate-pulse', label: 'Training', color: 'text-amber-700', bg: 'bg-amber-50'  },
  archived: { dot: 'bg-gray-400',                label: 'Archived', color: 'text-gray-500',  bg: 'bg-gray-100'  },
};

const DATASETS = [
  { id: 'ds-1', label: 'Sunscreen Formulations v3', rows: '2,450', features: 18, quality: 98.8 },
  { id: 'ds-2', label: 'Surfactant CMC Dataset',    rows: '1,820', features: 12, quality: 95.2 },
  { id: 'ds-3', label: 'Emollient Benchmark Set',   rows: '445',   features: 22, quality: 97.4 },
  { id: 'ds-4', label: 'UV Filter Screen Panel',    rows: '892',   features: 16, quality: 91.3 },
];

/* model → training dataset ID */
const MODEL_DATASET_MAP: Record<string, string> = {
  'mdl-1': 'ds-1', 'mdl-2': 'ds-2', 'mdl-3': 'ds-3',
  'mdl-4': 'ds-4', 'mdl-5': 'ds-1',
};

/* Full dataset detail records for the viewer modal */
const DATASET_DETAILS: Record<string, DatasetInfo> = {
  'ds-1': {
    id: 'ds-1', name: 'Sunscreen Formulation Database',
    description: 'Historical R&D dataset of 2,450 sunscreen formulations with measured SPF, water resistance, and stability outcomes. Curated from internal lab records 2019–2025.',
    rows: 2450, columns: 18, sizeMB: 4.2, quality: 98.8,
    source: 'Internal R&D Database', format: 'CSV',
    lastUpdated: '2 days ago', project: 'Sunscreen SPF Optimization', status: 'ready',
    tags: ['sunscreen', 'SPF', 'UV filters', 'w/o emulsion'],
    schema: [
      { name: 'Formula_ID',      type: 'string',      role: 'ID',       completeness: 100,  sample: 'F-001' },
      { name: 'ZnO_pct',         type: 'float',       role: 'Input',    completeness: 100,  sample: '12.4', min: '0.0',   max: '25.0'  },
      { name: 'TiO2_pct',        type: 'float',       role: 'Input',    completeness: 100,  sample: '7.2',  min: '0.0',   max: '25.0'  },
      { name: 'Avobenzone_pct',  type: 'float',       role: 'Input',    completeness: 99.8, sample: '2.8',  min: '0.0',   max: '5.0'   },
      { name: 'Octocrylene_pct', type: 'float',       role: 'Input',    completeness: 98.2, sample: '1.5',  min: '0.0',   max: '10.0'  },
      { name: 'Homosalate_pct',  type: 'float',       role: 'Input',    completeness: 97.4, sample: '3.1',  min: '0.0',   max: '15.0'  },
      { name: 'Emollient_type',  type: 'categorical', role: 'Input',    completeness: 100,  sample: 'D5',   unique: 5    },
      { name: 'pH',              type: 'float',       role: 'Input',    completeness: 99.5, sample: '5.8',  min: '4.2',   max: '7.5'   },
      { name: 'Viscosity_cP',    type: 'float',       role: 'Input',    completeness: 94.3, sample: '12450',min: '500',   max: '45000' },
      { name: 'Water_pct',       type: 'float',       role: 'Input',    completeness: 100,  sample: '58.3', min: '30.0',  max: '72.0'  },
      { name: 'SPF_in_vitro',    type: 'float',       role: 'Output',   completeness: 100,  sample: '38.2', min: '10.0',  max: '68.4'  },
      { name: 'WR_pct',          type: 'float',       role: 'Output',   completeness: 96.1, sample: '88.5', min: '60.0',  max: '99.1'  },
      { name: 'Stability_12M',   type: 'float',       role: 'Output',   completeness: 89.4, sample: '0.94', min: '0.70',  max: '1.00'  },
      { name: 'Stability_24M',   type: 'float',       role: 'Output',   completeness: 76.2, sample: '0.89', min: '0.65',  max: '1.00'  },
      { name: 'Cost_per_kg',     type: 'float',       role: 'Input',    completeness: 100,  sample: '4.25', min: '1.80',  max: '9.40'  },
      { name: 'Batch_ID',        type: 'string',      role: 'ID',       completeness: 100,  sample: 'B-2023-441' },
      { name: 'Lab_technician',  type: 'string',      role: 'Metadata', completeness: 100,  sample: 'J. Smith' },
      { name: 'Notes',           type: 'string',      role: 'Metadata', completeness: 45.2, sample: '—' },
    ],
    preview: [
      { 'Formula_ID': 'F-001', 'ZnO_pct': 12.4, 'TiO2_pct': 7.2,  'Avobenzone_pct': 2.8, 'pH': 5.8, 'SPF_in_vitro': 38.2, 'WR_pct': 88.5, 'Cost_per_kg': 4.25 },
      { 'Formula_ID': 'F-002', 'ZnO_pct': 14.8, 'TiO2_pct': 8.5,  'Avobenzone_pct': 3.0, 'pH': 6.1, 'SPF_in_vitro': 45.6, 'WR_pct': 92.1, 'Cost_per_kg': 5.10 },
      { 'Formula_ID': 'F-003', 'ZnO_pct': 10.0, 'TiO2_pct': 5.0,  'Avobenzone_pct': 1.5, 'pH': 5.5, 'SPF_in_vitro': 22.4, 'WR_pct': 74.3, 'Cost_per_kg': 3.20 },
      { 'Formula_ID': 'F-004', 'ZnO_pct': 16.5, 'TiO2_pct': 9.0,  'Avobenzone_pct': 3.5, 'pH': 6.4, 'SPF_in_vitro': 52.8, 'WR_pct': 95.4, 'Cost_per_kg': 6.15 },
      { 'Formula_ID': 'F-005', 'ZnO_pct': 18.0, 'TiO2_pct': 10.2, 'Avobenzone_pct': 4.0, 'pH': 6.7, 'SPF_in_vitro': 61.2, 'WR_pct': 97.8, 'Cost_per_kg': 7.40 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 94.2, color: '#3F98FF' },
      { label: 'Validity',     value: 99.6, color: '#059669' },
      { label: 'Consistency',  value: 98.4, color: '#7c3aed' },
      { label: 'Accuracy',     value: 98.8, color: '#ea580c' },
    ],
  },
  'ds-2': {
    id: 'ds-2', name: 'Surfactant CMC Dataset',
    description: 'Critical micelle concentration (CMC) measurements for 1,820 ionic and non-ionic surfactants. Compiled from literature (Langmuir, JCIS) and in-house measurements.',
    rows: 1820, columns: 12, sizeMB: 2.1, quality: 95.2,
    source: 'Literature + Internal', format: 'CSV',
    lastUpdated: '2 weeks ago', project: 'Surfactant CMC Prediction', status: 'ready',
    tags: ['surfactant', 'CMC', 'HLB', 'micelle', 'ionic'],
    schema: [
      { name: 'Surfactant_ID',    type: 'string',      role: 'ID',       completeness: 100,  sample: 'S-001' },
      { name: 'SMILES',           type: 'string',      role: 'Input',    completeness: 98.4, sample: 'CCCCCCCCCC...' },
      { name: 'Tail_length',      type: 'integer',     role: 'Input',    completeness: 100,  sample: '12',   min: '6',    max: '22'    },
      { name: 'Head_type',        type: 'categorical', role: 'Input',    completeness: 100,  sample: 'Anionic', unique: 4 },
      { name: 'HLB',              type: 'float',       role: 'Input',    completeness: 97.8, sample: '11.2', min: '1.0',  max: '20.0'  },
      { name: 'MW_g_mol',         type: 'float',       role: 'Input',    completeness: 100,  sample: '288.5',min: '150',  max: '720'   },
      { name: 'pKa',              type: 'float',       role: 'Input',    completeness: 82.4, sample: '—',    min: '0.5',  max: '14.0'  },
      { name: 'Temp_C',           type: 'float',       role: 'Input',    completeness: 100,  sample: '25.0', min: '15.0', max: '70.0'  },
      { name: 'Ionic_strength_M', type: 'float',       role: 'Input',    completeness: 91.2, sample: '0.1',  min: '0.0',  max: '1.0'   },
      { name: 'pH_measured',      type: 'float',       role: 'Input',    completeness: 88.6, sample: '7.0',  min: '2.0',  max: '12.0'  },
      { name: 'CMC_mM',           type: 'float',       role: 'Output',   completeness: 100,  sample: '8.2',  min: '0.001',max: '150.0' },
      { name: 'Source',           type: 'string',      role: 'Metadata', completeness: 100,  sample: 'Langmuir 2022' },
    ],
    preview: [
      { 'Surfactant_ID': 'S-001', 'Tail_length': 12, 'Head_type': 'Anionic',      'HLB': 11.2, 'Temp_C': 25.0, 'CMC_mM': 8.2  },
      { 'Surfactant_ID': 'S-002', 'Tail_length': 14, 'Head_type': 'Anionic',      'HLB': 12.8, 'Temp_C': 25.0, 'CMC_mM': 2.1  },
      { 'Surfactant_ID': 'S-003', 'Tail_length': 12, 'Head_type': 'Non-ionic',    'HLB': 15.4, 'Temp_C': 25.0, 'CMC_mM': 0.08 },
      { 'Surfactant_ID': 'S-004', 'Tail_length': 16, 'Head_type': 'Cationic',     'HLB': 8.6,  'Temp_C': 30.0, 'CMC_mM': 0.92 },
      { 'Surfactant_ID': 'S-005', 'Tail_length': 10, 'Head_type': 'Zwitterionic', 'HLB': 14.1, 'Temp_C': 25.0, 'CMC_mM': 26.4 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 89.5, color: '#3F98FF' },
      { label: 'Validity',     value: 98.2, color: '#059669' },
      { label: 'Consistency',  value: 96.8, color: '#7c3aed' },
      { label: 'Accuracy',     value: 97.4, color: '#ea580c' },
    ],
  },
  'ds-3': {
    id: 'ds-3', name: 'Emollient Rheology Study',
    description: 'Rheological and sensory characterization of 445 emollient blends. Includes oscillatory shear, viscometry, texture analysis, and trained-panel sensory evaluations.',
    rows: 445, columns: 22, sizeMB: 1.8, quality: 97.4,
    source: 'Pilot Plant — Formulation Lab B', format: 'XLSX',
    lastUpdated: '1 week ago', project: 'Emollient Texture Analysis', status: 'ready',
    tags: ['emollient', 'rheology', 'viscosity', 'sensory', 'texture'],
    schema: [
      { name: 'Sample_ID',                type: 'string', role: 'ID',     completeness: 100,  sample: 'E-001' },
      { name: 'Cyclopentasiloxane_pct',   type: 'float',  role: 'Input',  completeness: 100,  sample: '15.0', min: '0', max: '40'    },
      { name: 'Dimethicone_pct',          type: 'float',  role: 'Input',  completeness: 100,  sample: '5.0',  min: '0', max: '20'    },
      { name: 'Isononyl_isononanoate_pct',type: 'float',  role: 'Input',  completeness: 98.6, sample: '8.0',  min: '0', max: '25'    },
      { name: 'Viscosity_25C_cP',         type: 'float',  role: 'Output', completeness: 100,  sample: '18500',min: '100',max: '80000' },
      { name: 'G_prime_Pa',               type: 'float',  role: 'Output', completeness: 95.3, sample: '124.8',min: '0.1',max: '5000'  },
      { name: 'Tan_delta',                type: 'float',  role: 'Output', completeness: 95.3, sample: '0.42', min: '0.1',max: '5.0'   },
      { name: 'Spreadability_score',      type: 'float',  role: 'Output', completeness: 88.5, sample: '7.2',  min: '1.0',max: '10.0'  },
      { name: 'Silkiness_score',          type: 'float',  role: 'Output', completeness: 88.5, sample: '6.8',  min: '1.0',max: '10.0'  },
      { name: 'Greasiness_score',         type: 'float',  role: 'Output', completeness: 88.5, sample: '3.1',  min: '1.0',max: '10.0'  },
    ],
    preview: [
      { 'Sample_ID': 'E-001', 'Cyclopentasiloxane_pct': 15.0, 'Dimethicone_pct': 5.0, 'Viscosity_25C_cP': 18500, 'Spreadability_score': 7.2, 'Silkiness_score': 6.8 },
      { 'Sample_ID': 'E-002', 'Cyclopentasiloxane_pct': 20.0, 'Dimethicone_pct': 3.0, 'Viscosity_25C_cP': 12400, 'Spreadability_score': 8.4, 'Silkiness_score': 8.1 },
      { 'Sample_ID': 'E-003', 'Cyclopentasiloxane_pct': 10.0, 'Dimethicone_pct': 8.0, 'Viscosity_25C_cP': 28900, 'Spreadability_score': 5.8, 'Silkiness_score': 5.2 },
      { 'Sample_ID': 'E-004', 'Cyclopentasiloxane_pct': 25.0, 'Dimethicone_pct': 2.0, 'Viscosity_25C_cP': 8800,  'Spreadability_score': 9.1, 'Silkiness_score': 8.9 },
      { 'Sample_ID': 'E-005', 'Cyclopentasiloxane_pct': 12.0, 'Dimethicone_pct': 6.0, 'Viscosity_25C_cP': 21200, 'Spreadability_score': 6.6, 'Silkiness_score': 6.4 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 93.8, color: '#3F98FF' },
      { label: 'Validity',     value: 100,  color: '#059669' },
      { label: 'Consistency',  value: 99.1, color: '#7c3aed' },
      { label: 'Accuracy',     value: 97.1, color: '#ea580c' },
    ],
  },
  'ds-4': {
    id: 'ds-4', name: 'UV Filter Photo-Stability Panel',
    description: 'Photo-degradation kinetics for 892 UV filter + stabilizer combinations under controlled xenon arc lamp exposure (ICH Q1B equivalent). Measured via UV-Vis spectroscopy at 1h intervals.',
    rows: 892, columns: 16, sizeMB: 3.1, quality: 91.3,
    source: 'External Partner — Heliosphere Labs', format: 'CSV',
    lastUpdated: 'Today', project: 'UV Filter Photo-Stability', status: 'warning',
    tags: ['UV filter', 'photostability', 'degradation', 'xenon arc'],
    schema: [
      { name: 'Sample_ID',          type: 'string',      role: 'ID',     completeness: 100,  sample: 'UV-001' },
      { name: 'UV_filter',          type: 'categorical', role: 'Input',  completeness: 100,  sample: 'Avobenzone', unique: 6 },
      { name: 'UV_filter_pct',      type: 'float',       role: 'Input',  completeness: 100,  sample: '3.0',  min: '0.5', max: '10.0' },
      { name: 'Stabilizer',         type: 'categorical', role: 'Input',  completeness: 94.8, sample: 'Octocrylene', unique: 8 },
      { name: 'Stabilizer_pct',     type: 'float',       role: 'Input',  completeness: 94.8, sample: '2.0',  min: '0.0', max: '10.0' },
      { name: 'Exposure_h',         type: 'float',       role: 'Input',  completeness: 100,  sample: '4.0',  min: '0.5', max: '24.0' },
      { name: 'Absorbance_initial', type: 'float',       role: 'Input',  completeness: 100,  sample: '1.42', min: '0.1', max: '3.5'  },
      { name: 'Absorbance_final',   type: 'float',       role: 'Output', completeness: 100,  sample: '1.18', min: '0.05',max: '3.5'  },
      { name: 'Degradation_pct',    type: 'float',       role: 'Output', completeness: 100,  sample: '16.9', min: '0.0', max: '95.0' },
      { name: 'Half_life_h',        type: 'float',       role: 'Output', completeness: 78.4, sample: '5.2',  min: '0.5', max: '48.0' },
    ],
    preview: [
      { 'Sample_ID': 'UV-001', 'UV_filter': 'Avobenzone',   'UV_filter_pct': 3.0, 'Stabilizer': 'Octocrylene', 'Exposure_h': 4.0, 'Degradation_pct': 16.9 },
      { 'Sample_ID': 'UV-002', 'UV_filter': 'Avobenzone',   'UV_filter_pct': 3.0, 'Stabilizer': 'BEMT',        'Exposure_h': 4.0, 'Degradation_pct': 4.2  },
      { 'Sample_ID': 'UV-003', 'UV_filter': 'BMDBM',        'UV_filter_pct': 2.0, 'Stabilizer': 'None',        'Exposure_h': 4.0, 'Degradation_pct': 38.1 },
      { 'Sample_ID': 'UV-004', 'UV_filter': 'Octinoxate',   'UV_filter_pct': 7.5, 'Stabilizer': 'Octocrylene', 'Exposure_h': 8.0, 'Degradation_pct': 22.4 },
      { 'Sample_ID': 'UV-005', 'UV_filter': 'Bemotrizinol', 'UV_filter_pct': 1.5, 'Stabilizer': 'None',        'Exposure_h': 4.0, 'Degradation_pct': 1.8  },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 86.2, color: '#3F98FF' },
      { label: 'Validity',     value: 97.8, color: '#059669' },
      { label: 'Consistency',  value: 92.4, color: '#7c3aed' },
      { label: 'Accuracy',     value: 91.2, color: '#ea580c' },
    ],
  },
};

/* ── Fields available for sweeping / prediction (by dataset) ── */

const SWEEP_FIELDS: Record<string, { key: string; label: string; min: number; max: number; unit: string; defaultSteps: number }[]> = {
  'ds-1': [
    { key: 'ZnO_pct',        label: 'Zinc Oxide %',        min: 0,   max: 25,    unit: '% w/w', defaultSteps: 6  },
    { key: 'TiO2_pct',       label: 'TiO₂ %',             min: 0,   max: 25,    unit: '% w/w', defaultSteps: 6  },
    { key: 'Avobenzone_pct', label: 'Avobenzone %',        min: 0,   max: 5,     unit: '% w/w', defaultSteps: 6  },
    { key: 'Octocrylene_pct',label: 'Octocrylene %',       min: 0,   max: 10,    unit: '% w/w', defaultSteps: 5  },
    { key: 'Homosalate_pct', label: 'Homosalate %',        min: 0,   max: 15,    unit: '% w/w', defaultSteps: 5  },
    { key: 'pH',             label: 'pH',                  min: 4.2, max: 7.5,   unit: '',      defaultSteps: 7  },
    { key: 'Viscosity_cP',   label: 'Viscosity (cP)',      min: 500, max: 45000, unit: 'cP',    defaultSteps: 8  },
    { key: 'Water_pct',      label: 'Water %',             min: 30,  max: 72,    unit: '% w/w', defaultSteps: 7  },
    { key: 'Cost_per_kg',    label: 'Cost per kg',         min: 1.8, max: 9.4,   unit: '$/kg',  defaultSteps: 8  },
  ],
  'ds-2': [
    { key: 'Tail_length',     label: 'Tail Length',        min: 6,   max: 22,    unit: '',      defaultSteps: 8  },
    { key: 'HLB',             label: 'HLB',                min: 1,   max: 20,    unit: '',      defaultSteps: 10 },
    { key: 'MW_g_mol',        label: 'Mol. Weight',        min: 150, max: 720,   unit: 'g/mol', defaultSteps: 6  },
    { key: 'Temp_C',          label: 'Temperature',        min: 15,  max: 70,    unit: '°C',    defaultSteps: 7  },
    { key: 'Ionic_strength_M',label: 'Ionic Strength',     min: 0,   max: 1,     unit: 'M',     defaultSteps: 5  },
    { key: 'pH_measured',     label: 'pH',                 min: 2,   max: 12,    unit: '',      defaultSteps: 6  },
  ],
  'ds-3': [
    { key: 'Cyclopentasiloxane_pct',    label: 'Cyclopentasiloxane %', min: 0,  max: 40, unit: '% w/w', defaultSteps: 8 },
    { key: 'Dimethicone_pct',           label: 'Dimethicone %',        min: 0,  max: 20, unit: '% w/w', defaultSteps: 5 },
    { key: 'Isononyl_isononanoate_pct', label: 'Isononyl Isonon. %',   min: 0,  max: 25, unit: '% w/w', defaultSteps: 6 },
  ],
  'ds-4': [
    { key: 'UV_filter_pct',  label: 'UV Filter %',         min: 0.5, max: 10,  unit: '% w/w', defaultSteps: 6 },
    { key: 'Stabilizer_pct', label: 'Stabilizer %',        min: 0,   max: 10,  unit: '% w/w', defaultSteps: 5 },
    { key: 'Exposure_h',     label: 'Exposure (h)',         min: 0.5, max: 24,  unit: 'h',     defaultSteps: 8 },
    { key: 'Absorbance_initial',label:'Absorbance Initial', min: 0.1, max: 3.5, unit: 'AU',    defaultSteps: 5 },
  ],
};

const FORWARD_INPUT_DEFAULTS: Record<string, ForwardInputField[]> = {
  'ds-1': [
    { field: 'ZnO_pct',        label: 'Zinc Oxide',     value: '15.2', unit: '% w/w', min: 0,   max: 25,    type: 'number' },
    { field: 'TiO2_pct',       label: 'TiO₂',           value: '8.5',  unit: '% w/w', min: 0,   max: 25,    type: 'number' },
    { field: 'Avobenzone_pct', label: 'Avobenzone',     value: '3.0',  unit: '% w/w', min: 0,   max: 5,     type: 'number' },
    { field: 'Octocrylene_pct',label: 'Octocrylene',    value: '2.2',  unit: '% w/w', min: 0,   max: 10,    type: 'number' },
    { field: 'Homosalate_pct', label: 'Homosalate',     value: '3.1',  unit: '% w/w', min: 0,   max: 15,    type: 'number' },
    { field: 'Emollient_type', label: 'Emollient Type', value: 'D5',   unit: '',      min: 0,   max: 0,     type: 'categorical', options: ['D5', 'Isopropyl Myristate', 'Caprylic/Capric', 'Squalane', 'Jojoba Oil'] },
    { field: 'pH',             label: 'pH',             value: '5.8',  unit: '',      min: 4.2, max: 7.5,   type: 'number' },
    { field: 'Viscosity_cP',   label: 'Viscosity',      value: '12450',unit: 'cP',   min: 500, max: 45000,  type: 'number' },
    { field: 'Water_pct',      label: 'Water',          value: '54.1', unit: '% w/w', min: 30,  max: 72,    type: 'number' },
    { field: 'Cost_per_kg',    label: 'Cost/kg',        value: '4.25', unit: '$/kg',  min: 1.8, max: 9.4,   type: 'number' },
  ],
  'ds-2': [
    { field: 'Tail_length',     label: 'Tail Length',   value: '12',  unit: '',      min: 6,   max: 22,   type: 'number' },
    { field: 'Head_type',       label: 'Head Type',     value: 'Anionic',unit: '',   min: 0,   max: 0,    type: 'categorical', options: ['Anionic', 'Cationic', 'Non-ionic', 'Zwitterionic'] },
    { field: 'HLB',             label: 'HLB',           value: '11.2', unit: '',     min: 1,   max: 20,   type: 'number' },
    { field: 'MW_g_mol',        label: 'Mol. Weight',   value: '288.5',unit:'g/mol', min: 150, max: 720,  type: 'number' },
    { field: 'Temp_C',          label: 'Temperature',   value: '25.0', unit: '°C',  min: 15,  max: 70,   type: 'number' },
    { field: 'Ionic_strength_M',label: 'Ionic Strength',value: '0.1',  unit: 'M',   min: 0,   max: 1,    type: 'number' },
    { field: 'pH_measured',     label: 'pH',            value: '7.0',  unit: '',     min: 2,   max: 12,   type: 'number' },
  ],
  'ds-3': [
    { field: 'Cyclopentasiloxane_pct',    label: 'Cyclopentasiloxane', value: '15.0', unit: '% w/w', min: 0, max: 40, type: 'number' },
    { field: 'Dimethicone_pct',           label: 'Dimethicone',        value: '5.0',  unit: '% w/w', min: 0, max: 20, type: 'number' },
    { field: 'Isononyl_isononanoate_pct', label: 'Isononyl Isonon.',   value: '8.0',  unit: '% w/w', min: 0, max: 25, type: 'number' },
  ],
  'ds-4': [
    { field: 'UV_filter',        label: 'UV Filter',        value: 'Avobenzone', unit: '', min: 0, max: 0, type: 'categorical', options: ['Avobenzone', 'BMDBM', 'Octinoxate', 'Bemotrizinol', 'Octocrylene', 'Ensulizole'] },
    { field: 'UV_filter_pct',    label: 'UV Filter %',      value: '3.0',  unit: '% w/w', min: 0.5, max: 10, type: 'number' },
    { field: 'Stabilizer',       label: 'Stabilizer',       value: 'Octocrylene', unit: '', min: 0, max: 0, type: 'categorical', options: ['None', 'Octocrylene', 'BEMT', 'Drometrizole', 'Tinuvin 928', 'Mexoryl SX', 'Tinosorb M', 'DHHB'] },
    { field: 'Stabilizer_pct',   label: 'Stabilizer %',     value: '2.0',  unit: '% w/w', min: 0, max: 10, type: 'number' },
    { field: 'Exposure_h',       label: 'Exposure',         value: '4.0',  unit: 'h',     min: 0.5, max: 24, type: 'number' },
    { field: 'Absorbance_initial',label: 'Absorbance (t=0)',value: '1.42', unit: 'AU',     min: 0.1, max: 3.5, type: 'number' },
  ],
};

/* ── Simulated prediction helper ─────────────────────────────── */

function simulatePrediction(inputs: ForwardInputField[], datasetId: string): PredictionResult {
  if (datasetId === 'ds-1') {
    const get = (f: string) => parseFloat(inputs.find(i => i.field === f)?.value ?? '0') || 0;
    const zno = get('ZnO_pct'), tio2 = get('TiO2_pct'), avo = get('Avobenzone_pct');
    const oct = get('Octocrylene_pct'), ph = get('pH'), visc = get('Viscosity_cP');
    const spf = Math.min(68, Math.max(8, 12 + zno * 1.8 + tio2 * 1.4 + avo * 3.1 + oct * 0.9 + (ph - 5) * -1.2 + Math.random() * 1.5 - 0.75));
    const wr  = Math.min(99, Math.max(55, 68 + zno * 1.1 + tio2 * 0.7 + visc * 0.0008 + Math.random() * 2 - 1));
    const s12 = Math.min(1, Math.max(0.5, 0.82 + tio2 * 0.006 + (avo > 3 ? -0.04 : 0.02) + Math.random() * 0.04 - 0.02));
    const s24 = Math.min(1, Math.max(0.5, s12 - 0.04 + Math.random() * 0.02 - 0.01));
    return { spf: Math.round(spf * 10)/10, wr: Math.round(wr * 10)/10, stability12m: Math.round(s12 * 1000)/1000, stability24m: Math.round(s24 * 1000)/1000, confidence: 0.94 };
  }
  if (datasetId === 'ds-2') {
    const tail = parseFloat(inputs.find(i => i.field === 'Tail_length')?.value ?? '12') || 12;
    const hlb  = parseFloat(inputs.find(i => i.field === 'HLB')?.value ?? '11') || 11;
    const cmc  = Math.max(0.001, 120 / Math.pow(2, tail - 6) * (hlb / 15) + Math.random() * 0.5);
    return { spf: 0, wr: 0, stability12m: 0, stability24m: 0, confidence: 0.89 };
  }
  return { spf: 42.1, wr: 88.4, stability12m: 0.91, stability24m: 0.87, confidence: 0.92 };
}

const DEFAULT_CONSTRAINTS: Constraint[] = [
  { id: 'c1', ingredient: 'Zinc Oxide', min: 5, max: 25, unit: '% w/w', type: 'regulatory' },
  { id: 'c2', ingredient: 'Titanium Dioxide', min: 0, max: 25, unit: '% w/w', type: 'regulatory' },
  { id: 'c3', ingredient: 'Avobenzone', min: 0, max: 5, unit: '% w/w', type: 'regulatory' },
  { id: 'c4', ingredient: 'Octocrylene', min: 0, max: 10, unit: '% w/w', type: 'regulatory' },
  { id: 'c5', ingredient: 'Total UV Filters', min: 5, max: 35, unit: '% w/w', type: 'process' },
  { id: 'c6', ingredient: 'pH', min: 5.0, max: 7.5, unit: '', type: 'process' },
];

const DEFAULT_CONFIG = {
  iterations: 1000,
  acquisitionFn: 'Expected Improvement',
  cvFolds: 5,
  randomSeed: 42,
  parallelWorkers: 8,
  explorationRate: 0.2,
};

const STATUS_CONFIG = {
  active: { icon: <Clock className="w-3 h-3" />, color: 'text-[#3F98FF]', bg: 'bg-blue-50', label: 'Active' },
  achieved: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-600', bg: 'bg-green-50', label: 'Done' },
  pending: { icon: <Clock className="w-3 h-3" />, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Pending' },
  'at-risk': { icon: <AlertCircle className="w-3 h-3" />, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Risk' },
};

const TYPE_CONFIG = {
  regulatory: { label: 'Reg.', color: 'text-purple-600 bg-purple-50' },
  process: { label: 'Proc.', color: 'text-blue-600 bg-blue-50' },
  cost: { label: 'Cost', color: 'text-amber-600 bg-amber-50' },
};

/* ── Constraint slider ranges ────────────────────────────────── */

const CONSTRAINT_SLIDER_RANGES: Record<string, { min: number; max: number; step: number }> = {
  'zinc oxide':        { min: 0, max: 30,  step: 0.5 },
  'titanium dioxide':  { min: 0, max: 30,  step: 0.5 },
  'avobenzone':        { min: 0, max: 10,  step: 0.1 },
  'octocrylene':       { min: 0, max: 15,  step: 0.1 },
  'total uv filters':  { min: 0, max: 50,  step: 1   },
  'ph':                { min: 3, max: 10,  step: 0.1 },
};
const DEFAULT_SLIDER_RANGE = { min: 0, max: 100, step: 1 };

/* ── Constraint slider card ──────────────────────────────────── */

function ConstraintSlider({
  constraint,
  onChange,
  onDelete,
}: {
  constraint: Constraint;
  onChange: (id: string, patch: Partial<Constraint>) => void;
  onDelete: (id: string) => void;
}) {
  const sliderKey = constraint.ingredient.toLowerCase().trim();
  const range = CONSTRAINT_SLIDER_RANGES[sliderKey] ?? DEFAULT_SLIDER_RANGE;

  const minVal = constraint.min ?? range.min;
  const maxVal = constraint.max ?? range.max;
  const hasMin = constraint.min !== undefined;
  const hasMax = constraint.max !== undefined;

  const minPct = Math.max(0, Math.min(100, ((minVal - range.min) / (range.max - range.min)) * 100));
  const maxPct = Math.max(0, Math.min(100, ((maxVal - range.min) / (range.max - range.min)) * 100));

  const TYPES: Array<Constraint['type']> = ['regulatory', 'process', 'cost'];
  const cycleType = () => {
    const next = TYPES[(TYPES.indexOf(constraint.type) + 1) % TYPES.length];
    onChange(constraint.id, { type: next });
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
      {/* Header: ingredient name (editable) + type badge + delete */}
      <div className="flex items-center gap-1.5 mb-2">
        <input
          type="text"
          value={constraint.ingredient}
          onChange={(e) => onChange(constraint.id, { ingredient: e.target.value })}
          className="flex-1 min-w-0 text-[10px] font-semibold text-gray-800 bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-[#3F98FF] focus:outline-none leading-tight truncate"
        />
        <button
          type="button"
          onClick={cycleType}
          title="Click to change type"
          className={`text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0 cursor-pointer transition-opacity hover:opacity-70 ${TYPE_CONFIG[constraint.type].color}`}
        >
          {TYPE_CONFIG[constraint.type].label}
        </button>
        <button
          type="button"
          onClick={() => onDelete(constraint.id)}
          className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors shrink-0"
          title="Remove constraint"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Min slider */}
      {hasMin && (
        <div className={hasMax ? 'mb-2.5' : undefined}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">Min</span>
            <span className="text-[10px] font-bold tabular-nums text-[#3F98FF]">
              {minVal}{constraint.unit ? ` ${constraint.unit}` : ''}
            </span>
          </div>
          <input
            type="range"
            min={range.min}
            max={hasMax ? Math.min(maxVal, range.max) : range.max}
            step={range.step}
            value={minVal}
            onChange={(e) => onChange(constraint.id, { min: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3F98FF ${minPct}%, #e5e7eb ${minPct}%)`,
              accentColor: '#3F98FF',
            }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[7px] text-gray-300">{range.min}</span>
            <span className="text-[7px] text-gray-300">{range.max}{constraint.unit ? ` ${constraint.unit}` : ''}</span>
          </div>
        </div>
      )}

      {/* Max slider */}
      {hasMax && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">Max</span>
            <span className="text-[10px] font-bold tabular-nums text-[#3F98FF]">
              {maxVal}{constraint.unit ? ` ${constraint.unit}` : ''}
            </span>
          </div>
          <input
            type="range"
            min={hasMin ? Math.max(minVal, range.min) : range.min}
            max={range.max}
            step={range.step}
            value={maxVal}
            onChange={(e) => onChange(constraint.id, { max: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3F98FF ${maxPct}%, #e5e7eb ${maxPct}%)`,
              accentColor: '#3F98FF',
            }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[7px] text-gray-300">{range.min}</span>
            <span className="text-[7px] text-gray-300">{range.max}{constraint.unit ? ` ${constraint.unit}` : ''}</span>
          </div>
        </div>
      )}

      {!hasMin && !hasMax && (
        <p className="text-[9px] text-gray-400 text-center py-1">No bounds set</p>
      )}
    </div>
  );
}

/* ── Objective slider card ───────────────────────────────────── */

const PRIORITY_DEFAULT_WEIGHTS: Record<string, number> = {
  high: 80,
  medium: 55,
  low: 30,
};

function ObjectiveSlider({
  obj,
  weight,
  onWeightChange,
  onTargetToggle,
  onValueChange,
}: {
  obj: Objective;
  weight: number;
  onWeightChange: (id: string, val: number) => void;
  onTargetToggle: (id: string) => void;
  onValueChange: (id: string, val: string) => void;
}) {
  const status = STATUS_CONFIG[obj.status];
  const [editingValue, setEditingValue] = useState(false);
  const [valueBuffer, setValueBuffer] = useState(String(obj.value ?? ''));
  const valueInputRef = useRef<HTMLInputElement>(null);

  const commitValue = () => {
    onValueChange(obj.id, valueBuffer.trim());
    setEditingValue(false);
  };

  const startEditValue = () => {
    setValueBuffer(String(obj.value ?? ''));
    setEditingValue(true);
    setTimeout(() => valueInputRef.current?.select(), 0);
  };

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        obj.status === 'achieved'
          ? 'border-green-200 bg-green-50/60'
          : obj.status === 'at-risk'
          ? 'border-amber-200 bg-amber-50/60'
          : obj.status === 'active'
          ? 'border-[#3F98FF]/20 bg-blue-50/40'
          : 'border-gray-100 bg-gray-50'
      }`}
    >
      {/* Header: attribute name + status badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-semibold text-gray-800 flex-1 leading-tight truncate">
          {obj.attribute}
        </span>
        <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0 ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>

      {/* Direction toggle + target value row */}
      <div className="flex items-center gap-1.5 mb-2.5">
        {/* Maximize / Minimize toggle */}
        <button
          onClick={() => onTargetToggle(obj.id)}
          title="Click to toggle maximize / minimize"
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] font-semibold transition-all shrink-0 ${
            obj.target === 'maximize'
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
          }`}
        >
          {obj.target === 'maximize' ? (
            <TrendingUp className="w-2.5 h-2.5" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5" />
          )}
          {obj.target === 'maximize' ? 'Max' : 'Min'}
        </button>

        {/* Target value — click to edit */}
        <div className="flex-1 min-w-0">
          {editingValue ? (
            <div className="flex items-center gap-1">
              <input
                ref={valueInputRef}
                value={valueBuffer}
                autoFocus
                onChange={(e) => setValueBuffer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitValue();
                  if (e.key === 'Escape') setEditingValue(false);
                }}
                onBlur={commitValue}
                className="flex-1 min-w-0 text-[10px] text-gray-800 bg-white border border-[#3F98FF] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#3F98FF]/30"
                placeholder="e.g. 50 or 95%"
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); commitValue(); }}
                className="shrink-0 w-4 h-4 flex items-center justify-center text-[#3F98FF] hover:bg-blue-50 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditValue}
              title="Click to edit target"
              className="group w-full flex items-center gap-1 px-1.5 py-1 rounded border border-dashed border-gray-200 hover:border-[#3F98FF]/50 hover:bg-[#3F98FF]/5 transition-colors"
            >
              <span className="text-[9px] text-gray-400 shrink-0">Target:</span>
              <span className="text-[9px] font-semibold text-gray-700 flex-1 truncate">
                {obj.value != null && obj.value !== '' ? `${obj.value}${obj.unit ? ` ${obj.unit}` : ''}` : '—'}
              </span>
              <Edit2 className="w-2.5 h-2.5 text-gray-300 group-hover:text-[#3F98FF] shrink-0 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Importance slider */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">
            Importance
          </span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: weight >= 70 ? '#3F98FF' : weight >= 40 ? '#7c3aed' : '#9ca3af' }}
          >
            {weight}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={weight}
          onChange={(e) => onWeightChange(obj.id, Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3F98FF ${weight}%, #e5e7eb ${weight}%)`,
            accentColor: '#3F98FF',
          }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[7px] text-gray-300">Low</span>
          <span className="text-[7px] text-gray-300">High</span>
        </div>
      </div>

      {/* Progress bar */}
      {obj.progress !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-gray-400">Progress</span>
            {obj.currentValue && (
              <span className="text-[9px] font-bold text-green-700">{obj.currentValue}</span>
            )}
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${obj.progress}%`,
                backgroundColor:
                  obj.progress >= 90 ? '#059669' : obj.progress >= 50 ? '#3F98FF' : '#f59e0b',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Live Predictor panel ────────────────────────────────────── */

function LivePredictor({
  inputs, onInputChange, isPredicting, result, datasetId, modelLabel,
}: {
  inputs: ForwardInputField[];
  onInputChange: (field: string, value: string) => void;
  isPredicting: boolean;
  result: PredictionResult | null;
  datasetId: string;
  modelLabel: string;
}) {
  const [open, setOpen] = useState(true);

  const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

  return (
    <div className="shrink-0 border-t-2 border-[#3F98FF]/20 bg-gradient-to-b from-[#3F98FF]/[0.03] to-white">
      {/* Header — always visible, clickable to collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#3F98FF]/5 transition-colors"
      >
        <div className="w-5 h-5 rounded-md bg-[#3F98FF]/15 flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-[#3F98FF]" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[11px] font-bold text-[#3F98FF] leading-none">Live Predictor</div>
          <div className="text-[8px] text-gray-400 mt-0.5 truncate">
            {isPredicting ? 'Computing…' : result ? `SPF ${result.spf.toFixed(1)} · WR ${result.wr.toFixed(1)}%` : 'Adjust inputs to predict'}
          </div>
        </div>
        {/* Live pulse dot */}
        {isPredicting ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3F98FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3F98FF]" />
          </span>
        ) : result ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
        ) : null}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Input fields — compact two-column layout */}
          <div className="space-y-1">
            {inputs.map(inp => (
              <div key={inp.field} className="flex items-center gap-2">
                <label className="text-[9px] text-gray-500 flex-1 truncate">{inp.label}</label>
                {inp.type === 'categorical' ? (
                  <select
                    value={inp.value}
                    onChange={e => onInputChange(inp.field, e.target.value)}
                    className="w-[90px] text-[10px] font-semibold text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5 appearance-none cursor-pointer focus:outline-none focus:border-[#3F98FF] transition-colors shrink-0"
                    style={{ backgroundImage: CHEVRON_SVG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', paddingRight: '16px' }}
                  >
                    {inp.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={inp.value}
                      min={inp.min}
                      max={inp.max}
                      step="any"
                      onChange={e => onInputChange(inp.field, e.target.value)}
                      className="w-14 text-[10px] font-semibold text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#3F98FF] focus:ring-1 focus:ring-[#3F98FF]/20 transition-colors text-right"
                    />
                    {inp.unit && <span className="text-[8px] text-gray-400 w-7 shrink-0 truncate">{inp.unit}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Results area */}
          <div className={`rounded-xl overflow-hidden border transition-all duration-300 ${isPredicting ? 'border-[#3F98FF]/30 bg-[#3F98FF]/5' : result ? 'border-green-200 bg-green-50/60' : 'border-gray-100 bg-gray-50'}`}>
            {isPredicting ? (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Loader2 className="w-3.5 h-3.5 text-[#3F98FF] animate-spin shrink-0" />
                <div>
                  <p className="text-[10px] text-[#3F98FF] font-semibold">Computing prediction…</p>
                  <p className="text-[8px] text-gray-400">{modelLabel}</p>
                </div>
              </div>
            ) : result && datasetId === 'ds-1' ? (
              <div className="p-2.5">
                {/* 2×2 output grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    { label: 'SPF',        value: result.spf.toFixed(1),                         unit: '',  color: '#3F98FF', good: result.spf >= 50 },
                    { label: 'WR',         value: result.wr.toFixed(1),                          unit: '%', color: '#7c3aed', good: result.wr >= 90 },
                    { label: 'Stab 12M',   value: (result.stability12m * 100).toFixed(1),        unit: '%', color: '#059669', good: result.stability12m >= 0.95 },
                    { label: 'Stab 24M',   value: (result.stability24m * 100).toFixed(1),        unit: '%', color: '#ea580c', good: result.stability24m >= 0.90 },
                  ].map(r => (
                    <div key={r.label} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-[8px] text-gray-400 leading-none mb-0.5">{r.label}</div>
                        <div className="text-[12px] font-bold leading-none" style={{ color: r.color }}>{r.value}<span className="text-[9px] font-medium ml-0.5">{r.unit}</span></div>
                      </div>
                      <span className={`text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${r.good ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {r.good ? '✓' : '↑'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-400">Model confidence</span>
                  <span className="text-[9px] font-bold text-gray-600">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ) : result ? (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <p className="text-[10px] text-green-700 font-medium">Prediction ready — see canvas</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                <p className="text-[9px] text-gray-400">Adjust any input above to see live results</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────── */

function Section({
  title, icon, children, defaultOpen = true, badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-gray-400 shrink-0">{icon}</span>
        <span className="text-[11px] font-semibold text-gray-700 flex-1">{title}</span>
        {badge && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-[#3F98FF]/10 text-[#3F98FF] rounded-full mr-1">
            {badge}
          </span>
        )}
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

/* ── Select row ──────────────────────────────────────────────── */

function SelectRow({
  label, value, options, onChange,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      {label && <div className="text-[10px] text-gray-400 mb-1">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[11px] text-gray-800 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 appearance-none cursor-pointer hover:border-[#3F98FF]/50 focus:outline-none focus:border-[#3F98FF] focus:ring-1 focus:ring-[#3F98FF]/20 transition-colors"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function WorkspaceConfigPanel({
  objectives,
  isLocked = false,
  recipesGenerated = false,
  isGenerating = false,
  onGenerate,
  insights = [],
  modelMetrics = null,
  projectId: propProjectId = '1',
  modelId: propModelId = 'mdl-1',
  modelVersion: propModelVersion = 'v3.0',
  objectiveWeights: controlledWeights,
  onWeightsChange,
  onWeightChange,
  onObjectivesChange,
  onConstraintsChange,
}: WorkspaceConfigPanelProps) {
  const [configTab, setConfigTab] = useState<'config' | 'insights' | 'predictor'>('config');
  const newInsightCount = insights.filter((i) => i.isNew).length;
  const [config, setConfig] = useState<WorkspaceConfig>({
    projectId: propProjectId,
    experimentType: 'doe',
    modelId: propModelId,
    modelVersion: propModelVersion,
  });

  // Keep model/project in sync with controlled props from parent
  useEffect(() => {
    setConfig((c) => ({ ...c, projectId: propProjectId, modelId: propModelId, modelVersion: propModelVersion }));
  }, [propProjectId, propModelId, propModelVersion]);

  const [constraints, setConstraints] = useState<Constraint[]>(DEFAULT_CONSTRAINTS);
  const [advConfig, setAdvConfig] = useState(DEFAULT_CONFIG);
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [viewingDataset, setViewingDataset] = useState<DatasetInfo | null>(null);

  /* ── Parameter Sweep state ──────────────────────────────────── */
  const [sweepParams,        setSweepParams]        = useState<SweepParam[]>([]);
  const [remainingStrategy,  setRemainingStrategy]  = useState<RemainingStrategy>('mean');
  const [remainingCustomVals,setRemainingCustomVals]= useState<Record<string, string>>({});

  /* ── Forward Prediction state ───────────────────────────────── */
  const [forwardInputs,  setForwardInputs]  = useState<ForwardInputField[]>([]);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isPredicting,     setIsPredicting]     = useState(false);
  const [predictionRan,    setPredictionRan]    = useState(false);

  /* Sync forward inputs when model/dataset changes */
  const currentDatasetId = MODEL_DATASET_MAP[config.modelId] ?? 'ds-1';
  useEffect(() => {
    const defaults = FORWARD_INPUT_DEFAULTS[currentDatasetId] ?? FORWARD_INPUT_DEFAULTS['ds-1'];
    setForwardInputs(defaults.map(f => ({ ...f })));
    setPredictionResult(null);
    setPredictionRan(false);
  }, [currentDatasetId]);

  /* Sync sweep params when dataset changes — reset */
  useEffect(() => {
    setSweepParams([]);
    setRemainingCustomVals({});
  }, [currentDatasetId]);

  const sweepFieldOptions = SWEEP_FIELDS[currentDatasetId] ?? SWEEP_FIELDS['ds-1'] ?? [];

  const addSweepParam = () => {
    const used = sweepParams.map(p => p.field);
    const next = sweepFieldOptions.find(f => !used.includes(f.key));
    if (!next) return;
    setSweepParams(prev => [...prev, {
      id: `sp-${Date.now()}`,
      field: next.key,
      min: next.min,
      max: next.max,
      steps: next.defaultSteps,
    }]);
  };

  const removeSweepParam = (id: string) => {
    setSweepParams(prev => prev.filter(p => p.id !== id));
  };

  const updateSweepParam = (id: string, patch: Partial<SweepParam>) => {
    setSweepParams(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const handleRunPrediction = () => {
    if (isPredicting) return;
    setIsPredicting(true);
    setPredictionResult(null);
    setTimeout(() => {
      const result = simulatePrediction(forwardInputs, currentDatasetId);
      setPredictionResult(result);
      setIsPredicting(false);
      setPredictionRan(true);
    }, 700);
  };

  const updateForwardInput = (field: string, value: string) => {
    setForwardInputs(prev => prev.map(f => f.field === field ? { ...f, value } : f));
  };

  /* Auto-predict with debounce whenever inputs change */
  const liveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (forwardInputs.length === 0) return;
    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current);
    setIsPredicting(true);
    liveDebounceRef.current = setTimeout(() => {
      const result = simulatePrediction(forwardInputs, currentDatasetId);
      setPredictionResult(result);
      setIsPredicting(false);
      setPredictionRan(true);
    }, 600);
    return () => { if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current); };
  }, [forwardInputs]);

  const totalSweepRuns = sweepParams.reduce((acc, p) => acc * p.steps, sweepParams.length > 0 ? 1 : 0);

  /* ── Local editable copy of objectives ─────────────────────── */
  const [localObjectives, setLocalObjectives] = useState<Objective[]>(objectives);
  // Use a ref so closures always read the latest value without re-creating handlers
  const localObjectivesRef = useRef<Objective[]>(objectives);

  // Keep in sync when the parent updates objectives (e.g. stage advances)
  useEffect(() => {
    setLocalObjectives(objectives);
    localObjectivesRef.current = objectives;
    // seed weights for any new objective ids
    setObjectiveWeights((prev) => {
      const next = { ...prev };
      objectives.forEach((o) => {
        if (!(o.id in next)) next[o.id] = PRIORITY_DEFAULT_WEIGHTS[o.priority] ?? 50;
      });
      return next;
    });
  }, [objectives]);

  /* ── Objective importance weights ──────────────────────────── */
  const [objectiveWeights, setObjectiveWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    objectives.forEach((o) => {
      init[o.id] = PRIORITY_DEFAULT_WEIGHTS[o.priority] ?? 50;
    });
    return init;
  });
  // Ref so weight closures always read latest
  const objectiveWeightsRef = useRef<Record<string, number>>({});
  useEffect(() => { objectiveWeightsRef.current = objectiveWeights; }, [objectiveWeights]);

  // Debounce ref for objectives callback (kept for handleValueChange text input)
  const objCallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use controlled weights from parent if provided, otherwise internal state
  const effectiveWeights = controlledWeights ?? objectiveWeights;

  const handleWeightChange = (id: string, val: number) => {
    // Direct parent notification (simplest path — guaranteed to update parent state)
    onWeightChange?.(id, val);
    const newWeights = { ...effectiveWeights, [id]: val };
    setObjectiveWeights(newWeights);
    objectiveWeightsRef.current = newWeights;
    onWeightsChange?.(newWeights);
    onObjectivesChange?.(localObjectivesRef.current, newWeights);
  };

  const handleTargetToggle = (id: string) => {
    setLocalObjectives((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, target: o.target === 'maximize' ? 'minimize' as const : 'maximize' as const } : o
      );
      localObjectivesRef.current = next;
      onObjectivesChange?.(next, objectiveWeightsRef.current);
      return next;
    });
  };

  const handleValueChange = (id: string, val: string) => {
    setLocalObjectives((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, value: val } : o));
      localObjectivesRef.current = next;
      if (objCallbackTimer.current) clearTimeout(objCallbackTimer.current);
      objCallbackTimer.current = setTimeout(() => onObjectivesChange?.(next, objectiveWeightsRef.current), 80);
      return next;
    });
  };

  // Notify parent when constraints change (skip first mount)
  const constraintMountRef = useRef(true);
  useEffect(() => {
    if (constraintMountRef.current) { constraintMountRef.current = false; return; }
    onConstraintsChange?.(constraints);
  }, [constraints]);

  /* ── Staleness tracking ─────────────────────────────────────── */
  type ConfigSnapshot = { config: WorkspaceConfig; constraintIds: string[] };
  const generatedSnapshot = useRef<ConfigSnapshot | null>(null);

  // Clear snapshot when recipes are reset
  useEffect(() => {
    if (!recipesGenerated) generatedSnapshot.current = null;
  }, [recipesGenerated]);

  const snap = generatedSnapshot.current;
  const staleProject     = !!snap && snap.config.projectId      !== config.projectId;
  const staleExpType     = !!snap && snap.config.experimentType !== config.experimentType;
  const staleModel       = !!snap && (snap.config.modelId !== config.modelId || snap.config.modelVersion !== config.modelVersion);
  const staleConstraints = !!snap && JSON.stringify(snap.constraintIds) !== JSON.stringify(constraints.map((c) => c.id));
  const anyStale         = staleProject || staleExpType || staleModel || staleConstraints;

  const handleGenerate = () => {
    generatedSnapshot.current = {
      config: { ...config },
      constraintIds: constraints.map((c) => c.id),
    };
    onGenerate?.();
  };

  /* ── Stale pill ─────────────────────────────────────────────── */
  const StalePill = ({ label }: { label: string }) => (
    <div className="flex items-center gap-1 mt-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
      <RotateCcw className="w-2.5 h-2.5 text-amber-500 shrink-0" />
      <span className="text-[9px] text-amber-700 font-medium leading-snug">
        {label} changed — <span className="font-semibold">re-run to update recipes</span>
      </span>
    </div>
  );

  const achieved = localObjectives.filter((o) => o.status === 'achieved').length;
  const selectedProject = PROJECTS.find((p) => p.id === config.projectId);
  const selectedExpType = EXPERIMENT_TYPES.find((e) => e.id === config.experimentType);
  const selectedModel   = MODELS.find((m) => m.id === config.modelId);
  const selectedVersion = selectedModel?.versions.find((v) => v.version === config.modelVersion)
    ?? selectedModel?.versions[0];

  const removeConstraint = (id: string) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleConstraintChange = (id: string, patch: Partial<Constraint>) => {
    setConstraints((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  };

  const startEditConfig = (key: string, val: string | number) => {
    setEditingConfigKey(key);
    setEditBuffer(String(val));
  };

  const commitConfigEdit = (key: string) => {
    const num = parseFloat(editBuffer);
    if (!isNaN(num)) {
      setAdvConfig((prev) => ({ ...prev, [key]: num }));
    } else {
      setAdvConfig((prev) => ({ ...prev, [key]: editBuffer }));
    }
    setEditingConfigKey(null);
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${configTab === 'config' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setConfigTab('config')}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Config
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${configTab === 'predictor' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setConfigTab('predictor')}
        >
          <Zap className="w-3 h-3" />
          Predictor
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${configTab === 'insights' ? 'text-[#3F98FF] border-b-2 border-[#3F98FF] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setConfigTab('insights')}
        >
          <Brain className="w-3 h-3" />
          Insights
          {newInsightCount > 0 && (
            <span className="w-3.5 h-3.5 bg-[#3F98FF] text-white rounded-full text-[8px] flex items-center justify-center">
              {newInsightCount}
            </span>
          )}
        </button>
      </div>

      {configTab === 'insights' ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <InsightsPanel insights={insights} modelMetrics={modelMetrics} />
        </div>
      ) : configTab === 'predictor' ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <LivePredictor
            inputs={forwardInputs}
            onInputChange={updateForwardInput}
            isPredicting={isPredicting}
            result={predictionResult}
            datasetId={currentDatasetId}
            modelLabel={selectedModel?.label ?? ''}
          />
        </div>
      ) : (
      <>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Experiment Type ─────────────────────────────────── */}
        <Section title="Experiment Type" icon={<FlaskConical className="w-3.5 h-3.5" />} defaultOpen={true}>
          <SelectRow
            value={config.experimentType}
            onChange={(v) => setConfig((c) => ({ ...c, experimentType: v }))}
            options={EXPERIMENT_TYPES.map((e) => ({ value: e.id, label: `${e.icon} ${e.label}` }))}
          />
          {selectedExpType && (
            <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed">
              {config.experimentType === 'doe'     && 'Structured experimental design to maximize information gain from a minimal number of runs.'}
              {config.experimentType === 'sweep'   && 'Systematically vary one or more parameters across a defined range to map their effect on outputs.'}
              {config.experimentType === 'inverse' && 'Work backwards from desired output targets to identify the optimal input formulation parameters.'}
            </p>
          )}
          {staleExpType && <StalePill label="Experiment type" />}
        </Section>

        {/* ── Parameter Sweep config ───────────────────────────── */}
        {config.experimentType === 'sweep' && (
          <>
            {/* Sweep Parameters */}
            <Section
              title="Sweep Parameters"
              icon={<Repeat2 className="w-3.5 h-3.5" />}
              defaultOpen={true}
              badge={sweepParams.length > 0 ? `${sweepParams.length} param${sweepParams.length > 1 ? 's' : ''}` : undefined}
            >
              {sweepParams.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 bg-[#3F98FF]/8 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Hash className="w-4 h-4 text-[#3F98FF]/50" />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    No sweep parameters yet.<br />Add one or more to define your sweep space.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 mb-2">
                  {sweepParams.map((sp, idx) => {
                    const fieldMeta = sweepFieldOptions.find(f => f.key === sp.field);
                    const usedFields = sweepParams.filter(p => p.id !== sp.id).map(p => p.field);
                    const pointCount = sp.steps;
                    const step = sp.steps > 1 ? ((sp.max - sp.min) / (sp.steps - 1)) : 0;
                    return (
                      <div key={sp.id} className="rounded-lg border border-[#3F98FF]/20 bg-blue-50/30 p-2.5">
                        {/* Header */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-4 h-4 rounded bg-[#3F98FF]/15 text-[8px] font-bold text-[#3F98FF] flex items-center justify-center shrink-0">{idx + 1}</span>
                          <select
                            value={sp.field}
                            onChange={e => {
                              const meta = sweepFieldOptions.find(f => f.key === e.target.value);
                              if (meta) updateSweepParam(sp.id, { field: meta.key, min: meta.min, max: meta.max, steps: meta.defaultSteps });
                            }}
                            className="flex-1 text-[10px] font-semibold text-gray-800 bg-white border border-[#3F98FF]/30 rounded-md px-2 py-1 appearance-none cursor-pointer focus:outline-none focus:border-[#3F98FF] transition-colors"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', paddingRight: '22px' }}
                          >
                            {sweepFieldOptions.map(f => (
                              <option key={f.key} value={f.key} disabled={usedFields.includes(f.key)}>
                                {f.label}{usedFields.includes(f.key) ? ' (in use)' : ''}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => removeSweepParam(sp.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Min / Max / Steps */}
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[
                            { label: 'Min', key: 'min' as const, val: sp.min },
                            { label: 'Max', key: 'max' as const, val: sp.max },
                            { label: 'Steps', key: 'steps' as const, val: sp.steps },
                          ].map(({ label, key, val }) => (
                            <div key={key}>
                              <div className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-wider">{label}</div>
                              <input
                                type="number"
                                value={val}
                                min={key === 'steps' ? 2 : undefined}
                                step={key === 'steps' ? 1 : 'any'}
                                onChange={e => {
                                  const n = key === 'steps' ? Math.max(2, parseInt(e.target.value) || 2) : parseFloat(e.target.value);
                                  if (!isNaN(n)) updateSweepParam(sp.id, { [key]: n });
                                }}
                                className="w-full text-[10px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-[#3F98FF] focus:ring-1 focus:ring-[#3F98FF]/20 transition-colors"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Sweep range visualizer */}
                        <div className="bg-white rounded-md px-2 py-1.5 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] text-gray-400">Range: {sp.min} → {sp.max}{fieldMeta?.unit ? ` ${fieldMeta.unit}` : ''}</span>
                            <span className="text-[8px] font-semibold text-[#3F98FF]">{pointCount} pts · Δ{step > 0 ? step.toFixed(step < 1 ? 2 : 1) : '—'}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.min(pointCount, 12) }).map((_, i) => (
                              <div key={i} className="flex-1 h-2.5 rounded-sm bg-[#3F98FF]/20 border border-[#3F98FF]/30" style={{ opacity: 0.4 + (i / Math.min(pointCount - 1, 11)) * 0.6 }} />
                            ))}
                            {pointCount > 12 && <span className="text-[8px] text-gray-400 ml-1">+{pointCount - 12}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total run count */}
              {sweepParams.length > 0 && (
                <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-md mb-2 border border-gray-100">
                  <span className="text-[9px] text-gray-500">Total sweep runs</span>
                  <span className="text-[10px] font-bold text-[#3F98FF]">{totalSweepRuns.toLocaleString()}</span>
                </div>
              )}

              <button
                onClick={addSweepParam}
                disabled={sweepParams.length >= sweepFieldOptions.length}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-[#3F98FF]/30 text-[10px] text-[#3F98FF] hover:border-[#3F98FF] hover:bg-[#3F98FF]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                <Plus className="w-3 h-3" />
                Add Sweep Parameter
              </button>
            </Section>

            {/* Remaining Parameters */}
            <Section
              title="Remaining Parameters"
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              defaultOpen={true}
            >
              <p className="text-[9px] text-gray-400 mb-2 leading-relaxed">
                How should non-swept parameters be treated during the sweep?
              </p>

              {/* Strategy selector */}
              <div className="space-y-1 mb-3">
                {([
                  { key: 'mean',      icon: <Hash className="w-3 h-3" />,    label: 'Hold at dataset mean',       sub: 'Each param fixed at its training-set mean value' },
                  { key: 'baseline',  icon: <Zap className="w-3 h-3" />,     label: 'Use baseline formulation',   sub: 'Fix to reference formulation R-047 values' },
                  { key: 'custom',    icon: <Edit2 className="w-3 h-3" />,   label: 'Set custom fixed values',    sub: 'Manually specify a value for each remaining param' },
                  { key: 'randomize', icon: <Shuffle className="w-3 h-3" />, label: 'Randomize (Monte Carlo)',    sub: 'Sample remaining params from their training distribution' },
                ] as { key: RemainingStrategy; icon: React.ReactNode; label: string; sub: string }[]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setRemainingStrategy(opt.key)}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                      remainingStrategy === opt.key
                        ? 'border-[#3F98FF] bg-[#3F98FF]/8 text-[#3F98FF]'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${remainingStrategy === opt.key ? 'text-[#3F98FF]' : 'text-gray-400'}`}>{opt.icon}</span>
                    <div>
                      <div className="text-[10px] font-semibold leading-tight">{opt.label}</div>
                      <div className={`text-[8px] leading-snug mt-0.5 ${remainingStrategy === opt.key ? 'text-[#3F98FF]/70' : 'text-gray-400'}`}>{opt.sub}</div>
                    </div>
                    {remainingStrategy === opt.key && <Check className="w-3 h-3 ml-auto shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>

              {/* Custom values editor */}
              {remainingStrategy === 'custom' && (
                <div className="space-y-1.5 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                  <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fixed Values</div>
                  {sweepFieldOptions
                    .filter(f => !sweepParams.some(p => p.field === f.key))
                    .map(f => (
                      <div key={f.key} className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-600 flex-1 truncate">{f.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={remainingCustomVals[f.key] ?? String((f.min + f.max) / 2)}
                            onChange={e => setRemainingCustomVals(prev => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-16 text-[10px] font-semibold text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#3F98FF] transition-colors text-right"
                          />
                          {f.unit && <span className="text-[8px] text-gray-400">{f.unit}</span>}
                        </div>
                      </div>
                    ))}
                  {sweepFieldOptions.filter(f => !sweepParams.some(p => p.field === f.key)).length === 0 && (
                    <p className="text-[9px] text-gray-400 italic">All parameters are being swept.</p>
                  )}
                </div>
              )}

              {remainingStrategy === 'randomize' && (
                <div className="flex items-start gap-1.5 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                  <Shuffle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-700 leading-relaxed">
                    Each sweep point will sample non-swept parameters from the training distribution. Results show mean ± 1σ uncertainty bands.
                  </p>
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── Objectives ──────────────────────────────────────── */}
        <Section
          title="Objectives"
          icon={<Target className="w-3.5 h-3.5" />}
          defaultOpen={true}
          badge={`${achieved}/${localObjectives.length}`}
        >
          {localObjectives.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center py-2">No objectives defined yet</p>
          ) : (
            <div className="space-y-2">
              {/* Overall progress bar */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3F98FF] to-[#059669] rounded-full transition-all duration-700"
                    style={{ width: `${localObjectives.length ? (achieved / localObjectives.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 shrink-0">
                  {Math.round((achieved / Math.max(localObjectives.length, 1)) * 100)}%
                </span>
              </div>

              {localObjectives.map((obj) => (
                <ObjectiveSlider
                  key={obj.id}
                  obj={obj}
                  weight={effectiveWeights[obj.id] ?? PRIORITY_DEFAULT_WEIGHTS[obj.priority] ?? 50}
                  onWeightChange={handleWeightChange}
                  onTargetToggle={handleTargetToggle}
                  onValueChange={handleValueChange}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── Constraints ─────────────────────────────────────── */}
        <Section title="Constraints" icon={<ShieldCheck className="w-3.5 h-3.5" />} defaultOpen={false} badge={`${constraints.length}`}>
          <div className="space-y-2">
            {constraints.map((c) => (
              <ConstraintSlider
                key={c.id}
                constraint={c}
                onChange={handleConstraintChange}
                onDelete={removeConstraint}
              />
            ))}
          </div>
          <button
            onClick={() => {
              const newId = `c-${Date.now()}`;
              setConstraints((prev) => [
                ...prev,
                { id: newId, ingredient: 'New Ingredient', min: 0, max: 10, unit: '% w/w', type: 'process' },
              ]);
            }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-gray-300 text-[10px] text-gray-500 hover:border-[#3F98FF] hover:text-[#3F98FF] hover:bg-blue-50/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Constraint
          </button>
          {staleConstraints && <StalePill label="Constraints" />}
        </Section>

        {/* ── Advanced Configuration ───────────────────────────── */}
        <Section title="Configuration" icon={<SlidersHorizontal className="w-3.5 h-3.5" />} defaultOpen={false}>
          <div className="space-y-1">
            {(Object.entries(advConfig) as [string, string | number][]).map(([key, val]) => {
              const label: Record<string, string> = {
                iterations: 'Iterations',
                acquisitionFn: 'Acquisition Fn.',
                cvFolds: 'CV Folds',
                randomSeed: 'Random Seed',
                parallelWorkers: 'Parallel Workers',
                explorationRate: 'Exploration Rate',
              };
              const isEditing = editingConfigKey === key;
              return (
                <div key={key} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 group">
                  <span className="text-[9px] text-gray-500 flex-1 truncate">{label[key] ?? key}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        className="w-20 text-[10px] text-gray-800 bg-white border border-[#3F98FF] rounded px-1.5 py-0.5 focus:outline-none"
                        value={editBuffer}
                        autoFocus
                        onChange={(e) => setEditBuffer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitConfigEdit(key);
                          if (e.key === 'Escape') setEditingConfigKey(null);
                        }}
                      />
                      <button
                        onClick={() => commitConfigEdit(key)}
                        className="w-4 h-4 flex items-center justify-center text-[#3F98FF] hover:bg-blue-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-700">{String(val)}</span>
                      <button
                        onClick={() => startEditConfig(key, val)}
                        className="w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-400 transition-all"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Footer score */}
      {localObjectives.length > 0 && (
        <div className="px-3 py-2.5 border-t border-gray-200 bg-gradient-to-r from-[#3F98FF]/5 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-gray-500 mb-0.5">Optimization Score</div>
              <div className="text-xl font-bold text-[#3F98FF] leading-none">
                {achieved > 0 ? Math.round((achieved / localObjectives.length) * 100) : '--'}
                <span className="text-xs font-medium text-gray-400">{achieved > 0 ? '%' : ''}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-gray-500 mb-0.5">Objectives</div>
              <div className="text-[10px] font-semibold text-gray-700">{achieved}/{localObjectives.length} achieved</div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset viewer modal */}
      {viewingDataset && selectedModel && (
        <DatasetViewerModal
          dataset={viewingDataset}
          modelName={selectedModel.label}
          modelVersion={selectedVersion?.version ?? ''}
          onClose={() => setViewingDataset(null)}
        />
      )}

      </>
      )}
    </div>
  );
}