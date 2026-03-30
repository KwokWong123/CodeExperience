import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  Search, Upload, Database, ChevronDown, ChevronRight, Filter,
  CheckCircle2, AlertCircle, Clock, Tag, Download, Eye,
  Plus, BarChart2, Table2, FileSpreadsheet, Zap
} from 'lucide-react';

interface Column {
  name: string;
  type: 'float' | 'integer' | 'string' | 'categorical' | 'boolean';
  role: 'Input' | 'Output' | 'ID' | 'Metadata';
  completeness: number;
  sample: string;
  min?: string;
  max?: string;
  unique?: number;
}

interface Dataset {
  id: string;
  name: string;
  domain: string;
  domainColor: string;
  description: string;
  rows: number;
  columns: number;
  sizeMB: number;
  quality: number;
  source: string;
  format: string;
  tags: string[];
  lastUpdated: string;
  created: string;
  project: string;
  status: 'ready' | 'processing' | 'warning';
  schema: Column[];
  preview: Record<string, string | number>[];
  qualityBreakdown: { label: string; value: number; color: string }[];
}

const DATASETS: Dataset[] = [
  {
    id: 'ds-1',
    name: 'Sunscreen Formulation Database',
    domain: 'UV Protection',
    domainColor: '#3F98FF',
    description: 'Historical R&D dataset of 2,450 sunscreen formulations with measured SPF, water resistance, and stability outcomes. Curated from internal lab records 2019–2025.',
    rows: 2450,
    columns: 18,
    sizeMB: 4.2,
    quality: 98.8,
    source: 'Internal R&D Database',
    format: 'CSV',
    tags: ['sunscreen', 'SPF', 'UV filters', 'w/o emulsion'],
    lastUpdated: '2 days ago',
    created: 'Jan 5, 2026',
    project: 'Sunscreen SPF Optimization',
    status: 'ready',
    schema: [
      { name: 'Formula_ID', type: 'string', role: 'ID', completeness: 100, sample: 'F-001' },
      { name: 'ZnO_pct', type: 'float', role: 'Input', completeness: 100, sample: '12.4', min: '0.0', max: '25.0' },
      { name: 'TiO2_pct', type: 'float', role: 'Input', completeness: 100, sample: '7.2', min: '0.0', max: '25.0' },
      { name: 'Avobenzone_pct', type: 'float', role: 'Input', completeness: 99.8, sample: '2.8', min: '0.0', max: '5.0' },
      { name: 'Octocrylene_pct', type: 'float', role: 'Input', completeness: 98.2, sample: '1.5', min: '0.0', max: '10.0' },
      { name: 'Homosalate_pct', type: 'float', role: 'Input', completeness: 97.4, sample: '3.1', min: '0.0', max: '15.0' },
      { name: 'Emollient_type', type: 'categorical', role: 'Input', completeness: 100, sample: 'D5', unique: 5 },
      { name: 'pH', type: 'float', role: 'Input', completeness: 99.5, sample: '5.8', min: '4.2', max: '7.5' },
      { name: 'Viscosity_cP', type: 'float', role: 'Input', completeness: 94.3, sample: '12450', min: '500', max: '45000' },
      { name: 'Water_pct', type: 'float', role: 'Input', completeness: 100, sample: '58.3', min: '30.0', max: '72.0' },
      { name: 'SPF_in_vitro', type: 'float', role: 'Output', completeness: 100, sample: '38.2', min: '10.0', max: '68.4' },
      { name: 'WR_pct', type: 'float', role: 'Output', completeness: 96.1, sample: '88.5', min: '60.0', max: '99.1' },
      { name: 'Stability_12M', type: 'float', role: 'Output', completeness: 89.4, sample: '0.94', min: '0.70', max: '1.00' },
      { name: 'Stability_24M', type: 'float', role: 'Output', completeness: 76.2, sample: '0.89', min: '0.65', max: '1.00' },
      { name: 'Cost_per_kg', type: 'float', role: 'Input', completeness: 100, sample: '4.25', min: '1.80', max: '9.40' },
      { name: 'Batch_ID', type: 'string', role: 'ID', completeness: 100, sample: 'B-2023-441' },
      { name: 'Lab_technician', type: 'string', role: 'Metadata', completeness: 100, sample: 'J. Smith' },
      { name: 'Notes', type: 'string', role: 'Metadata', completeness: 45.2, sample: '—' },
    ],
    preview: [
      { 'Formula_ID': 'F-001', 'ZnO_pct': 12.4, 'TiO2_pct': 7.2, 'Avobenzone_pct': 2.8, 'pH': 5.8, 'SPF_in_vitro': 38.2, 'WR_pct': 88.5, 'Cost_per_kg': 4.25 },
      { 'Formula_ID': 'F-002', 'ZnO_pct': 14.8, 'TiO2_pct': 8.5, 'Avobenzone_pct': 3.0, 'pH': 6.1, 'SPF_in_vitro': 45.6, 'WR_pct': 92.1, 'Cost_per_kg': 5.10 },
      { 'Formula_ID': 'F-003', 'ZnO_pct': 10.0, 'TiO2_pct': 5.0, 'Avobenzone_pct': 1.5, 'pH': 5.5, 'SPF_in_vitro': 22.4, 'WR_pct': 74.3, 'Cost_per_kg': 3.20 },
      { 'Formula_ID': 'F-004', 'ZnO_pct': 16.5, 'TiO2_pct': 9.0, 'Avobenzone_pct': 3.5, 'pH': 6.4, 'SPF_in_vitro': 52.8, 'WR_pct': 95.4, 'Cost_per_kg': 6.15 },
      { 'Formula_ID': 'F-005', 'ZnO_pct': 18.0, 'TiO2_pct': 10.2, 'Avobenzone_pct': 4.0, 'pH': 6.7, 'SPF_in_vitro': 61.2, 'WR_pct': 97.8, 'Cost_per_kg': 7.40 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 94.2, color: '#3F98FF' },
      { label: 'Validity', value: 99.6, color: '#059669' },
      { label: 'Consistency', value: 98.4, color: '#7c3aed' },
      { label: 'Accuracy', value: 98.8, color: '#ea580c' },
    ],
  },
  {
    id: 'ds-2',
    name: 'Surfactant CMC Dataset',
    domain: 'Surface Chemistry',
    domainColor: '#7c3aed',
    description: 'Critical micelle concentration (CMC) measurements for 1,820 ionic and non-ionic surfactants. Compiled from literature (Langmuir, JCIS) and in-house measurements.',
    rows: 1820,
    columns: 12,
    sizeMB: 2.1,
    quality: 95.2,
    source: 'Literature + Internal',
    format: 'CSV',
    tags: ['surfactant', 'CMC', 'HLB', 'micelle', 'ionic'],
    lastUpdated: '2 weeks ago',
    created: 'Oct 18, 2025',
    project: 'Surfactant CMC Prediction',
    status: 'ready',
    schema: [
      { name: 'Surfactant_ID', type: 'string', role: 'ID', completeness: 100, sample: 'S-001' },
      { name: 'SMILES', type: 'string', role: 'Input', completeness: 98.4, sample: 'CCCCCCCCCC...' },
      { name: 'Tail_length', type: 'integer', role: 'Input', completeness: 100, sample: '12', min: '6', max: '22' },
      { name: 'Head_type', type: 'categorical', role: 'Input', completeness: 100, sample: 'Anionic', unique: 4 },
      { name: 'HLB', type: 'float', role: 'Input', completeness: 97.8, sample: '11.2', min: '1.0', max: '20.0' },
      { name: 'MW_g_mol', type: 'float', role: 'Input', completeness: 100, sample: '288.5', min: '150', max: '720' },
      { name: 'pKa', type: 'float', role: 'Input', completeness: 82.4, sample: '—', min: '0.5', max: '14.0' },
      { name: 'Temp_C', type: 'float', role: 'Input', completeness: 100, sample: '25.0', min: '15.0', max: '70.0' },
      { name: 'Ionic_strength_M', type: 'float', role: 'Input', completeness: 91.2, sample: '0.1', min: '0.0', max: '1.0' },
      { name: 'pH_measured', type: 'float', role: 'Input', completeness: 88.6, sample: '7.0', min: '2.0', max: '12.0' },
      { name: 'CMC_mM', type: 'float', role: 'Output', completeness: 100, sample: '8.2', min: '0.001', max: '150.0' },
      { name: 'Source', type: 'string', role: 'Metadata', completeness: 100, sample: 'Langmuir 2022' },
    ],
    preview: [
      { 'Surfactant_ID': 'S-001', 'Tail_length': 12, 'Head_type': 'Anionic', 'HLB': 11.2, 'Temp_C': 25.0, 'CMC_mM': 8.2 },
      { 'Surfactant_ID': 'S-002', 'Tail_length': 14, 'Head_type': 'Anionic', 'HLB': 12.8, 'Temp_C': 25.0, 'CMC_mM': 2.1 },
      { 'Surfactant_ID': 'S-003', 'Tail_length': 12, 'Head_type': 'Non-ionic', 'HLB': 15.4, 'Temp_C': 25.0, 'CMC_mM': 0.08 },
      { 'Surfactant_ID': 'S-004', 'Tail_length': 16, 'Head_type': 'Cationic', 'HLB': 8.6, 'Temp_C': 30.0, 'CMC_mM': 0.92 },
      { 'Surfactant_ID': 'S-005', 'Tail_length': 10, 'Head_type': 'Zwitterionic', 'HLB': 14.1, 'Temp_C': 25.0, 'CMC_mM': 26.4 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 89.5, color: '#3F98FF' },
      { label: 'Validity', value: 98.2, color: '#059669' },
      { label: 'Consistency', value: 96.8, color: '#7c3aed' },
      { label: 'Accuracy', value: 97.4, color: '#ea580c' },
    ],
  },
  {
    id: 'ds-3',
    name: 'Emollient Rheology Study',
    domain: 'Sensory Science',
    domainColor: '#059669',
    description: 'Rheological and sensory characterization of 445 emollient blends. Includes oscillatory shear, viscometry, texture analysis, and trained-panel sensory evaluations.',
    rows: 445,
    columns: 22,
    sizeMB: 1.8,
    quality: 97.4,
    source: 'Pilot Plant — Formulation Lab B',
    format: 'XLSX',
    tags: ['emollient', 'rheology', 'viscosity', 'sensory', 'texture'],
    lastUpdated: '1 week ago',
    created: 'Dec 3, 2025',
    project: 'Emollient Texture Analysis',
    status: 'ready',
    schema: [
      { name: 'Sample_ID', type: 'string', role: 'ID', completeness: 100, sample: 'E-001' },
      { name: 'Cyclopentasiloxane_pct', type: 'float', role: 'Input', completeness: 100, sample: '15.0', min: '0', max: '40' },
      { name: 'Dimethicone_pct', type: 'float', role: 'Input', completeness: 100, sample: '5.0', min: '0', max: '20' },
      { name: 'Isononyl_isononanoate_pct', type: 'float', role: 'Input', completeness: 98.6, sample: '8.0', min: '0', max: '25' },
      { name: 'Viscosity_25C_cP', type: 'float', role: 'Output', completeness: 100, sample: '18500', min: '100', max: '80000' },
      { name: 'G_prime_Pa', type: 'float', role: 'Output', completeness: 95.3, sample: '124.8', min: '0.1', max: '5000' },
      { name: 'Tan_delta', type: 'float', role: 'Output', completeness: 95.3, sample: '0.42', min: '0.1', max: '5.0' },
      { name: 'Spreadability_score', type: 'float', role: 'Output', completeness: 88.5, sample: '7.2', min: '1.0', max: '10.0' },
      { name: 'Silkiness_score', type: 'float', role: 'Output', completeness: 88.5, sample: '6.8', min: '1.0', max: '10.0' },
      { name: 'Greasiness_score', type: 'float', role: 'Output', completeness: 88.5, sample: '3.1', min: '1.0', max: '10.0' },
    ],
    preview: [
      { 'Sample_ID': 'E-001', 'Cyclopentasiloxane_pct': 15.0, 'Dimethicone_pct': 5.0, 'Viscosity_25C_cP': 18500, 'Spreadability_score': 7.2, 'Silkiness_score': 6.8 },
      { 'Sample_ID': 'E-002', 'Cyclopentasiloxane_pct': 20.0, 'Dimethicone_pct': 3.0, 'Viscosity_25C_cP': 12400, 'Spreadability_score': 8.4, 'Silkiness_score': 8.1 },
      { 'Sample_ID': 'E-003', 'Cyclopentasiloxane_pct': 10.0, 'Dimethicone_pct': 8.0, 'Viscosity_25C_cP': 28900, 'Spreadability_score': 5.8, 'Silkiness_score': 5.2 },
      { 'Sample_ID': 'E-004', 'Cyclopentasiloxane_pct': 25.0, 'Dimethicone_pct': 2.0, 'Viscosity_25C_cP': 8800, 'Spreadability_score': 9.1, 'Silkiness_score': 8.9 },
      { 'Sample_ID': 'E-005', 'Cyclopentasiloxane_pct': 12.0, 'Dimethicone_pct': 6.0, 'Viscosity_25C_cP': 21200, 'Spreadability_score': 6.6, 'Silkiness_score': 6.4 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 93.8, color: '#3F98FF' },
      { label: 'Validity', value: 100, color: '#059669' },
      { label: 'Consistency', value: 99.1, color: '#7c3aed' },
      { label: 'Accuracy', value: 97.1, color: '#ea580c' },
    ],
  },
  {
    id: 'ds-4',
    name: 'UV Filter Photo-Stability Panel',
    domain: 'Photochemistry',
    domainColor: '#ea580c',
    description: 'Photo-degradation kinetics for 892 UV filter + stabilizer combinations under controlled xenon arc lamp exposure (ICH Q1B equivalent). Measured via UV-Vis spectroscopy at 1h intervals.',
    rows: 892,
    columns: 16,
    sizeMB: 3.1,
    quality: 91.3,
    source: 'External Partner — Heliosphere Labs',
    format: 'CSV',
    tags: ['UV filter', 'photostability', 'degradation', 'xenon arc'],
    lastUpdated: 'Today',
    created: 'Mar 8, 2026',
    project: 'UV Filter Photo-Stability',
    status: 'warning',
    schema: [
      { name: 'Sample_ID', type: 'string', role: 'ID', completeness: 100, sample: 'UV-001' },
      { name: 'UV_filter', type: 'categorical', role: 'Input', completeness: 100, sample: 'Avobenzone', unique: 6 },
      { name: 'UV_filter_pct', type: 'float', role: 'Input', completeness: 100, sample: '3.0', min: '0.5', max: '10.0' },
      { name: 'Stabilizer', type: 'categorical', role: 'Input', completeness: 94.8, sample: 'Octocrylene', unique: 8 },
      { name: 'Stabilizer_pct', type: 'float', role: 'Input', completeness: 94.8, sample: '2.0', min: '0.0', max: '10.0' },
      { name: 'Exposure_h', type: 'float', role: 'Input', completeness: 100, sample: '4.0', min: '0.5', max: '24.0' },
      { name: 'Absorbance_initial', type: 'float', role: 'Input', completeness: 100, sample: '1.42', min: '0.1', max: '3.5' },
      { name: 'Absorbance_final', type: 'float', role: 'Output', completeness: 100, sample: '1.18', min: '0.05', max: '3.5' },
      { name: 'Degradation_pct', type: 'float', role: 'Output', completeness: 100, sample: '16.9', min: '0.0', max: '95.0' },
      { name: 'Half_life_h', type: 'float', role: 'Output', completeness: 78.4, sample: '5.2', min: '0.5', max: '48.0' },
    ],
    preview: [
      { 'Sample_ID': 'UV-001', 'UV_filter': 'Avobenzone', 'UV_filter_pct': 3.0, 'Stabilizer': 'Octocrylene', 'Exposure_h': 4.0, 'Degradation_pct': 16.9 },
      { 'Sample_ID': 'UV-002', 'UV_filter': 'Avobenzone', 'UV_filter_pct': 3.0, 'Stabilizer': 'BEMT', 'Exposure_h': 4.0, 'Degradation_pct': 4.2 },
      { 'Sample_ID': 'UV-003', 'UV_filter': 'BMDBM', 'UV_filter_pct': 2.0, 'Stabilizer': 'None', 'Exposure_h': 4.0, 'Degradation_pct': 38.1 },
      { 'Sample_ID': 'UV-004', 'UV_filter': 'Octinoxate', 'UV_filter_pct': 7.5, 'Stabilizer': 'Octocrylene', 'Exposure_h': 8.0, 'Degradation_pct': 22.4 },
      { 'Sample_ID': 'UV-005', 'UV_filter': 'Bemotrizinol', 'UV_filter_pct': 1.5, 'Stabilizer': 'None', 'Exposure_h': 4.0, 'Degradation_pct': 1.8 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 86.2, color: '#3F98FF' },
      { label: 'Validity', value: 97.8, color: '#059669' },
      { label: 'Consistency', value: 92.4, color: '#7c3aed' },
      { label: 'Accuracy', value: 91.2, color: '#ea580c' },
    ],
  },
  {
    id: 'ds-5',
    name: 'Historical SPF in-vitro Database',
    domain: 'UV Protection',
    domainColor: '#3F98FF',
    description: 'EU Consortium database of 3,100 in-vitro SPF measurements across 12 partner laboratories using ISO 24443:2021. Includes inter-lab reproducibility metadata and calibration records.',
    rows: 3100,
    columns: 24,
    sizeMB: 6.8,
    quality: 96.1,
    source: 'EU Sunscreen Consortium (ESC-2024)',
    format: 'Parquet',
    tags: ['SPF', 'in-vitro', 'UV transmission', 'ISO 24443', 'multi-lab'],
    lastUpdated: '1 month ago',
    created: 'Aug 14, 2025',
    project: 'Sunscreen SPF Optimization',
    status: 'ready',
    schema: [
      { name: 'Record_ID', type: 'string', role: 'ID', completeness: 100, sample: 'ESC-00001' },
      { name: 'Lab_ID', type: 'categorical', role: 'Metadata', completeness: 100, sample: 'LAB-04', unique: 12 },
      { name: 'ZnO_pct', type: 'float', role: 'Input', completeness: 100, sample: '10.0', min: '0', max: '25' },
      { name: 'TiO2_pct', type: 'float', role: 'Input', completeness: 100, sample: '6.0', min: '0', max: '25' },
      { name: 'SPF_in_vitro', type: 'float', role: 'Output', completeness: 100, sample: '32.4', min: '5', max: '100' },
      { name: 'CV_pct', type: 'float', role: 'Metadata', completeness: 98.2, sample: '3.1', min: '0.2', max: '18.5' },
    ],
    preview: [
      { 'Record_ID': 'ESC-00001', 'Lab_ID': 'LAB-04', 'ZnO_pct': 10.0, 'TiO2_pct': 6.0, 'SPF_in_vitro': 32.4, 'CV_pct': 3.1 },
      { 'Record_ID': 'ESC-00002', 'Lab_ID': 'LAB-07', 'ZnO_pct': 15.0, 'TiO2_pct': 8.0, 'SPF_in_vitro': 48.2, 'CV_pct': 4.4 },
      { 'Record_ID': 'ESC-00003', 'Lab_ID': 'LAB-01', 'ZnO_pct': 8.0, 'TiO2_pct': 4.0, 'SPF_in_vitro': 21.8, 'CV_pct': 2.8 },
      { 'Record_ID': 'ESC-00004', 'Lab_ID': 'LAB-11', 'ZnO_pct': 20.0, 'TiO2_pct': 10.0, 'SPF_in_vitro': 65.1, 'CV_pct': 6.2 },
      { 'Record_ID': 'ESC-00005', 'Lab_ID': 'LAB-04', 'ZnO_pct': 12.5, 'TiO2_pct': 7.5, 'SPF_in_vitro': 40.6, 'CV_pct': 3.8 },
    ],
    qualityBreakdown: [
      { label: 'Completeness', value: 96.4, color: '#3F98FF' },
      { label: 'Validity', value: 99.1, color: '#059669' },
      { label: 'Consistency', value: 94.8, color: '#7c3aed' },
      { label: 'Accuracy', value: 96.2, color: '#ea580c' },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  float: '#3F98FF',
  integer: '#7c3aed',
  string: '#059669',
  categorical: '#ea580c',
  boolean: '#0891b2',
};

const ROLE_COLORS: Record<string, string> = {
  Input: '#3F98FF',
  Output: '#059669',
  ID: '#9ca3af',
  Metadata: '#d97706',
};

type ActiveTab = 'schema' | 'preview' | 'quality';

const TOTAL_ROWS = DATASETS.reduce((a, d) => a + d.rows, 0);
const AVG_QUALITY = (DATASETS.reduce((a, d) => a + d.quality, 0) / DATASETS.length).toFixed(1);

export function DatasetsPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, ActiveTab>>({});
  const location = useLocation();

  // Auto-expand a dataset when navigated here via "Go to asset"
  useEffect(() => {
    const state = location.state as { expandedId?: string } | null;
    if (state?.expandedId) {
      setExpandedId(state.expandedId);
      setTimeout(() => {
        const el = document.getElementById(`dataset-row-${state.expandedId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.state]);

  const filtered = DATASETS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.domain.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const getTab = (id: string): ActiveTab => activeTab[id] || 'schema';
  const setTab = (id: string, tab: ActiveTab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));

  return (
    <div className="flex-1 overflow-auto bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Datasets</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Data Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage, explore, and connect formulation datasets to your projects</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm">
              <Upload className="w-4 h-4" />
              Import Dataset
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {[
            { label: 'Total Datasets', value: DATASETS.length, icon: Database, color: '#3F98FF' },
            { label: 'Total Records', value: TOTAL_ROWS.toLocaleString(), icon: Table2, color: '#7c3aed' },
            { label: 'Avg. Quality Score', value: AVG_QUALITY + '%', icon: CheckCircle2, color: '#059669' },
            { label: 'Storage Used', value: DATASETS.reduce((a, d) => a + d.sizeMB, 0).toFixed(1) + ' MB', icon: FileSpreadsheet, color: '#ea580c' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search datasets, domains, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white"
            />
          </div>
          <span className="text-xs text-gray-400">{filtered.length} datasets</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_80px_60px_80px_90px_100px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <div>Dataset</div>
            <div>Project</div>
            <div>Rows</div>
            <div>Cols</div>
            <div>Size</div>
            <div>Quality</div>
            <div>Updated</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((ds) => {
            const isExpanded = expandedId === ds.id;
            const tab = getTab(ds.id);

            return (
              <div key={ds.id} className="border-b border-gray-100 last:border-0">
                {/* Main row */}
                <div
                  id={`dataset-row-${ds.id}`}
                  className="grid grid-cols-[2fr_1fr_80px_60px_80px_90px_100px_80px] gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors items-center"
                  onClick={() => setExpandedId(isExpanded ? null : ds.id)}
                >
                  {/* Name + Domain */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: ds.domainColor + '15' }}
                    >
                      <Database className="w-4 h-4" style={{ color: ds.domainColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">{ds.name}</span>
                        {ds.status === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {ds.status === 'ready' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: ds.domainColor + '15', color: ds.domainColor }}>
                          {ds.domain}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{ds.format}</span>
                        {ds.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 truncate">{ds.project}</div>
                  <div className="text-xs font-medium text-gray-700">{ds.rows.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">{ds.columns}</div>
                  <div className="text-xs text-gray-600">{ds.sizeMB} MB</div>

                  {/* Quality bar */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${ds.quality}%`,
                            backgroundColor: ds.quality >= 95 ? '#059669' : ds.quality >= 85 ? '#3F98FF' : '#d97706',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: ds.quality >= 95 ? '#059669' : ds.quality >= 85 ? '#3F98FF' : '#d97706' }}>
                        {ds.quality}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {ds.lastUpdated}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#3F98FF] transition-colors" title="Preview">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#3F98FF] transition-colors" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#3F98FF] transition-colors" title="Add to project">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {/* Description */}
                    <div className="px-5 pt-4 pb-3">
                      <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">{ds.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-gray-400"><span className="font-medium text-gray-600">Source:</span> {ds.source}</span>
                        <span className="text-[10px] text-gray-400"><span className="font-medium text-gray-600">Created:</span> {ds.created}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {ds.tags.map((t) => (
                            <span key={t} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 px-5 bg-white">
                      {(['schema', 'preview', 'quality'] as ActiveTab[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(ds.id, t)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors capitalize ${
                            tab === t ? 'border-[#3F98FF] text-[#3F98FF]' : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {t === 'schema' && <Table2 className="w-3 h-3" />}
                          {t === 'preview' && <Eye className="w-3 h-3" />}
                          {t === 'quality' && <BarChart2 className="w-3 h-3" />}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="px-5 py-4">
                      {tab === 'schema' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
                                <th className="text-left pb-2 pr-4 font-semibold">Column</th>
                                <th className="text-left pb-2 pr-4 font-semibold">Type</th>
                                <th className="text-left pb-2 pr-4 font-semibold">Role</th>
                                <th className="text-left pb-2 pr-4 font-semibold">Completeness</th>
                                <th className="text-left pb-2 pr-4 font-semibold">Range / Unique</th>
                                <th className="text-left pb-2 font-semibold">Sample</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ds.schema.map((col, i) => (
                                <tr key={i} className="border-t border-gray-100 hover:bg-white/60 transition-colors">
                                  <td className="py-2 pr-4 font-mono font-medium text-gray-800">{col.name}</td>
                                  <td className="py-2 pr-4">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: TYPE_COLORS[col.type] + '15', color: TYPE_COLORS[col.type] }}>
                                      {col.type}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-4">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: ROLE_COLORS[col.role] + '15', color: ROLE_COLORS[col.role] }}>
                                      {col.role}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${col.completeness}%`, backgroundColor: col.completeness >= 95 ? '#059669' : '#d97706' }} />
                                      </div>
                                      <span className={`text-[10px] font-medium ${col.completeness >= 95 ? 'text-green-600' : 'text-amber-600'}`}>{col.completeness}%</span>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-4 text-gray-500 font-mono text-[10px]">
                                    {col.min && col.max ? `${col.min} – ${col.max}` : col.unique ? `${col.unique} unique` : '—'}
                                  </td>
                                  <td className="py-2 font-mono text-gray-600">{col.sample}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {tab === 'preview' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
                                {Object.keys(ds.preview[0]).map((col) => (
                                  <th key={col} className="text-left pb-2 pr-4 font-semibold font-mono whitespace-nowrap">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {ds.preview.map((row, i) => (
                                <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white/50' : ''}`}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="py-2 pr-4 font-mono text-gray-700 whitespace-nowrap">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-[10px] text-gray-400 mt-3">Showing 5 of {ds.rows.toLocaleString()} rows · {ds.columns} columns</p>
                        </div>
                      )}

                      {tab === 'quality' && (
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3F98FF]/10 to-[#7c3aed]/10 flex items-center justify-center">
                                <span className="text-lg font-bold" style={{ color: ds.quality >= 95 ? '#059669' : '#3F98FF' }}>{ds.quality}%</span>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-800">Overall Quality Score</div>
                                <div className="text-xs text-gray-400">
                                  {ds.quality >= 95 ? '✅ Excellent — ready for modeling' : ds.quality >= 85 ? '⚠️ Good — minor issues detected' : '❌ Fair — review recommended'}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {ds.qualityBreakdown.map((q) => (
                                <div key={q.label}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-600 font-medium">{q.label}</span>
                                    <span className="text-xs font-bold" style={{ color: q.color }}>{q.value}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${q.value}%`, backgroundColor: q.color }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            {[
                              { label: 'Outliers detected & removed', value: ds.id === 'ds-1' ? '3 rows (Mahalanobis >3σ)' : '0 rows', status: 'ok' },
                              { label: 'Duplicate records', value: '0 rows', status: 'ok' },
                              { label: 'Format/type errors', value: '0 values', status: 'ok' },
                              { label: 'Missing values', value: ds.id === 'ds-1' ? '143 values across 4 columns' : ds.id === 'ds-4' ? '215 values — review needed' : 'Minimal', status: ds.id === 'ds-4' ? 'warn' : 'ok' },
                              { label: 'Range violations', value: '0 values', status: 'ok' },
                              { label: 'Last validation run', value: ds.lastUpdated, status: 'ok' },
                            ].map((item) => (
                              <div key={item.label} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{item.label}</span>
                                <span className={`text-xs font-medium ${item.status === 'warn' ? 'text-amber-600' : 'text-gray-700'}`}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="px-5 pb-4 flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3F98FF] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors">
                        <Zap className="w-3 h-3" />
                        Use in Active Project
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <BarChart2 className="w-3 h-3" />
                        Run EDA
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Download className="w-3 h-3" />
                        Export
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}