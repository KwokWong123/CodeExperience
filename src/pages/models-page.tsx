import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search, Plus, ChevronRight, ChevronDown, LayoutGrid, List,
  CheckCircle2, Clock, AlertCircle, Zap, Download, Archive,
  MoreHorizontal, BrainCircuit, Activity, GitBranch, ExternalLink,
  Cpu, BarChart2, Terminal, Shield, RefreshCw, ArrowUpRight, Upload
} from 'lucide-react';

interface ModelVersion {
  version: string;
  date: string;
  r2: number;
  notes: string;
}

interface Model {
  id: string;
  name: string;
  datasetId: string;
  dataset: string;
  version: string;
  type: string;
  framework: string;
  project: string;
  projectColor: string;
  status: 'deployed' | 'staging' | 'archived' | 'training';
  r2: number;
  rmse: number;
  trainSamples: number;
  testSamples: number;
  features: number;
  inferenceMs: number;
  fileSize: string;
  lastRetrained: string;
  deployedAt?: string;
  endpoint?: string;
  description: string;
  experiment: string;
  versions: ModelVersion[];
  tags: string[];
  regulatory?: string;
}

interface DatasetSchemaField {
  name: string;
  type: 'float' | 'integer' | 'string' | 'categorical' | 'boolean';
}

interface DatasetOption {
  id: string;
  name: string;
  project: string;
  projectColor: string;
  rows: number;
  columns: number;
  sizeMB: number;
  schema: DatasetSchemaField[];
}

interface RegisterSchemaField extends DatasetSchemaField {
  role: 'feature' | 'target' | 'ignore';
}

const MODELS: Model[] = [
  {
    id: 'mdl-1',
    name: 'SPF-XGB-Ensemble',
    datasetId: 'ds-1',
    dataset: 'Sunscreen Formulation Database',
    version: 'v3.0',
    type: 'XGBoost + Random Forest',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'deployed',
    r2: 0.940,
    rmse: 2.31,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 12,
    fileSize: '48 MB',
    lastRetrained: 'Mar 14, 2026',
    deployedAt: 'Mar 14, 2026',
    endpoint: 'https://api.nobleai.io/v1/models/spf-xgb-ensemble-v3',
    description: 'Production ensemble model combining XGBoost (60%) and Random Forest (40%) for SPF prediction. Trained on 1,957 validated formulations. Used in Bayesian optimization engine for multi-objective candidate search.',
    experiment: 'XGB-Ensemble-v3',
    tags: ['production', 'SPF', 'ensemble', 'ISO-validated'],
    regulatory: 'EU Cosmetics Reg. 1223/2009 · ISO 24444:2021 compliant predictions',
    versions: [
      { version: 'v3.0', date: 'Mar 14, 2026', r2: 0.940, notes: 'Production. Added RF ensemble component.' },
      { version: 'v2.1', date: 'Mar 12, 2026', r2: 0.921, notes: 'Grid search hyperparameter optimization.' },
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.903, notes: 'Initial RF baseline.' },
    ],
  },
  {
    id: 'mdl-2',
    name: 'SPF-XGB-Ensemble',
    datasetId: 'ds-1',
    dataset: 'Sunscreen Formulation Database',
    version: 'v2.1',
    type: 'XGBoost',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'staging',
    r2: 0.921,
    rmse: 2.89,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 10,
    fileSize: '31 MB',
    lastRetrained: 'Mar 12, 2026',
    description: 'Previous production model — XGBoost only, no ensemble. Maintained in staging for A/B comparison against v3.0.',
    experiment: 'XGB-v2-grid-search',
    tags: ['staging', 'SPF'],
    versions: [
      { version: 'v2.1', date: 'Mar 12, 2026', r2: 0.921, notes: 'Grid search hyperparameter optimization.' },
      { version: 'v2.0', date: 'Mar 10, 2026', r2: 0.910, notes: 'Default XGBoost params.' },
    ],
  },
  {
    id: 'mdl-3',
    name: 'CMC-GP-Predictor',
    datasetId: 'ds-2',
    dataset: 'Surfactant CMC Dataset',
    version: 'v1.2',
    type: 'Gaussian Process',
    framework: 'scikit-learn (GPy)',
    project: 'Surfactant CMC Prediction',
    projectColor: '#7c3aed',
    status: 'deployed',
    r2: 0.887,
    rmse: 0.24,
    trainSamples: 1456,
    testSamples: 364,
    features: 12,
    inferenceMs: 48,
    fileSize: '12 MB',
    lastRetrained: 'Feb 28, 2026',
    deployedAt: 'Mar 2, 2026',
    endpoint: 'https://api.nobleai.io/v1/models/cmc-gp-predictor-v1',
    description: 'Gaussian Process regression model for CMC prediction with calibrated uncertainty. RBF + White kernel, optimized with 10 random restarts. Provides mean prediction ± 95% CI for experimental design guidance.',
    experiment: 'GP-surrogate-CMC',
    tags: ['production', 'CMC', 'uncertainty-aware', 'GP'],
    versions: [
      { version: 'v1.2', date: 'Feb 28, 2026', r2: 0.887, notes: 'RBF+WhiteKernel, 10 restarts. Production.' },
      { version: 'v1.1', date: 'Feb 20, 2026', r2: 0.871, notes: 'Matern kernel. Worse on interpolation.' },
      { version: 'v1.0', date: 'Feb 12, 2026', r2: 0.842, notes: 'Baseline GP, default kernel.' },
    ],
  },
  {
    id: 'mdl-4',
    name: 'Texture-LGBM',
    datasetId: 'ds-3',
    dataset: 'Emollient Rheology Study',
    version: 'v1.0',
    type: 'LightGBM',
    framework: 'LightGBM',
    project: 'Emollient Texture Analysis',
    projectColor: '#059669',
    status: 'staging',
    r2: 0.912,
    rmse: 0.42,
    trainSamples: 356,
    testSamples: 89,
    features: 22,
    inferenceMs: 8,
    fileSize: '22 MB',
    lastRetrained: 'Feb 22, 2026',
    description: 'Multi-output LightGBM model predicting three sensory scores (spreadability, silkiness, greasiness) from emollient blend composition and rheological properties. Pending HPO v2 comparison before production promotion.',
    experiment: 'LGBM-texture-v1',
    tags: ['staging', 'sensory', 'multi-output'],
    versions: [
      { version: 'v1.0', date: 'Feb 22, 2026', r2: 0.912, notes: 'Initial. Awaiting Optuna HPO v2.' },
    ],
  },
  {
    id: 'mdl-5',
    name: 'UV-DegradationXGB',
    datasetId: 'ds-4',
    dataset: 'UV Filter Photo-Stability Panel',
    version: 'v0.5-beta',
    type: 'XGBoost',
    framework: 'scikit-learn',
    project: 'UV Filter Photo-Stability',
    projectColor: '#ea580c',
    status: 'training',
    r2: 0,
    rmse: 0,
    trainSamples: 714,
    testSamples: 178,
    features: 16,
    inferenceMs: 0,
    fileSize: '—',
    lastRetrained: 'Mar 15, 2026',
    description: 'XGBoost model for predicting UV filter photodegradation rate (% loss per hour) under xenon arc exposure. Currently training with 5-fold CV. ETA: 22 minutes.',
    experiment: 'XGB-photostab-v1',
    tags: ['training', 'photostability', 'in-progress'],
    versions: [],
  },
  {
    id: 'mdl-6',
    name: 'SPF-Ridge-Baseline',
    datasetId: 'ds-1',
    dataset: 'Sunscreen Formulation Database',
    version: 'v1.0',
    type: 'Ridge Regression',
    framework: 'scikit-learn',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    status: 'archived',
    r2: 0.724,
    rmse: 5.18,
    trainSamples: 1957,
    testSamples: 490,
    features: 18,
    inferenceMs: 1,
    fileSize: '0.2 MB',
    lastRetrained: 'Feb 18, 2026',
    description: 'Linear baseline model. Archived after XGBoost models demonstrated significantly superior performance. Maintained for interpretability reference and regulatory documentation.',
    experiment: 'LinReg-SPF-baseline',
    tags: ['archived', 'baseline', 'linear', 'interpretable'],
    versions: [
      { version: 'v1.0', date: 'Feb 18, 2026', r2: 0.724, notes: 'Ridge regression baseline. Archived.' },
    ],
  },
];

const STATUS_CONFIG = {
  deployed: { label: 'Deployed', color: '#059669', bg: '#f0fdf4', icon: CheckCircle2, dot: 'bg-green-500' },
  staging: { label: 'Staging', color: '#3F98FF', bg: '#eff6ff', icon: Activity, dot: 'bg-blue-400' },
  archived: { label: 'Archived', color: '#9ca3af', bg: '#f9fafb', icon: Archive, dot: 'bg-gray-400' },
  training: { label: 'Training', color: '#d97706', bg: '#fffbeb', icon: RefreshCw, dot: 'bg-amber-400 animate-pulse' },
};

const FRAMEWORK_COLORS: Record<string, string> = {
  'scikit-learn': '#f97316',
  'LightGBM': '#22c55e',
  'scikit-learn (GPy)': '#8b5cf6',
  'PyTorch': '#ef4444',
  'XGBoost': '#3b82f6',
};

const DATASET_OPTIONS: DatasetOption[] = [
  {
    id: 'ds-1',
    name: 'Sunscreen Formulation Database',
    project: 'Sunscreen SPF Optimization',
    projectColor: '#3F98FF',
    rows: 2450,
    columns: 18,
    sizeMB: 4.2,
    schema: [
      { name: 'Formula_ID', type: 'string' },
      { name: 'ZnO_pct', type: 'float' },
      { name: 'TiO2_pct', type: 'float' },
      { name: 'Avobenzone_pct', type: 'float' },
      { name: 'Octocrylene_pct', type: 'float' },
      { name: 'pH', type: 'float' },
      { name: 'SPF_in_vitro', type: 'float' },
      { name: 'WR_pct', type: 'float' },
    ],
  },
  {
    id: 'ds-2',
    name: 'Surfactant CMC Dataset',
    project: 'Surfactant CMC Prediction',
    projectColor: '#7c3aed',
    rows: 1820,
    columns: 12,
    sizeMB: 2.1,
    schema: [
      { name: 'Surfactant_ID', type: 'string' },
      { name: 'Tail_length', type: 'integer' },
      { name: 'Head_type', type: 'categorical' },
      { name: 'HLB', type: 'float' },
      { name: 'Temp_C', type: 'float' },
      { name: 'CMC_mM', type: 'float' },
    ],
  },
  {
    id: 'ds-3',
    name: 'Emollient Rheology Study',
    project: 'Emollient Texture Analysis',
    projectColor: '#059669',
    rows: 445,
    columns: 22,
    sizeMB: 1.8,
    schema: [
      { name: 'Sample_ID', type: 'string' },
      { name: 'Cyclopentasiloxane_pct', type: 'float' },
      { name: 'Dimethicone_pct', type: 'float' },
      { name: 'Viscosity_25C_cP', type: 'float' },
      { name: 'Spreadability_score', type: 'float' },
      { name: 'Silkiness_score', type: 'float' },
    ],
  },
];

const buildInitialSchema = (dataset: DatasetOption): RegisterSchemaField[] =>
  dataset.schema.map((field, idx) => ({
    ...field,
    role: idx === dataset.schema.length - 1 ? 'target' : idx === 0 ? 'ignore' : 'feature',
  }));

const splitDelimitedLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ''));
};

const inferFieldType = (samples: string[]): DatasetSchemaField['type'] => {
  const values = samples.map((value) => value.trim()).filter((value) => value.length > 0);
  if (values.length === 0) return 'string';

  const isBoolean = values.every((value) => /^(true|false|0|1|yes|no)$/i.test(value));
  if (isBoolean) return 'boolean';

  const numericValues = values.filter((value) => !Number.isNaN(Number(value)));
  if (numericValues.length === values.length) {
    const allIntegers = numericValues.every((value) => Number.isInteger(Number(value)));
    return allIntegers ? 'integer' : 'float';
  }

  const uniqueCount = new Set(values.map((value) => value.toLowerCase())).size;
  if (uniqueCount <= Math.max(5, Math.floor(values.length * 0.2))) return 'categorical';

  return 'string';
};

const normalizeFieldName = (raw: string, fallbackIndex: number): string => {
  const cleaned = raw.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned || `column_${fallbackIndex + 1}`;
};

const parseUploadedDataset = (
  fileName: string,
  fileText: string,
): Pick<DatasetOption, 'rows' | 'columns' | 'schema'> => {
  const trimmed = fileText.trim();
  if (!trimmed) {
    throw new Error('Uploaded file is empty.');
  }

  if (fileName.toLowerCase().endsWith('.json')) {
    const payload = JSON.parse(trimmed);
    if (!Array.isArray(payload) || payload.length === 0 || typeof payload[0] !== 'object') {
      throw new Error('JSON must be an array of row objects.');
    }

    const headers = Object.keys(payload[0]);
    if (headers.length === 0) {
      throw new Error('JSON rows must contain at least one column.');
    }

    const schema = headers.map((header) => {
      const samples = payload.slice(0, 30).map((row) => String(row?.[header] ?? ''));
      return {
        name: normalizeFieldName(header, 0),
        type: inferFieldType(samples),
      };
    });

    return {
      rows: payload.length,
      columns: headers.length,
      schema,
    };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV/TSV must include a header and at least one data row.');
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = splitDelimitedLine(lines[0], delimiter).map((header, idx) => normalizeFieldName(header, idx));
  if (headers.length === 0) {
    throw new Error('Could not detect any columns from the uploaded file.');
  }

  const sampledRows = lines.slice(1, 31).map((line) => splitDelimitedLine(line, delimiter));
  const schema = headers.map((header, idx) => ({
    name: header,
    type: inferFieldType(sampledRows.map((row) => row[idx] ?? '')),
  }));

  return {
    rows: lines.length - 1,
    columns: headers.length,
    schema,
  };
};

export function ModelsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>(MODELS);
  const [datasetOptions, setDatasetOptions] = useState<DatasetOption[]>(DATASET_OPTIONS);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [schemaFields, setSchemaFields] = useState<RegisterSchemaField[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState('XGBoost');
  const [newFramework, setNewFramework] = useState('scikit-learn');
  const [trainSplit, setTrainSplit] = useState(80);
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [uploadedDatasetLabel, setUploadedDatasetLabel] = useState('');
  const [isUploadingDataset, setIsUploadingDataset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const selectedDataset = selectedDatasetId ? datasetOptions.find((dataset) => dataset.id === selectedDatasetId) ?? null : null;
  const targetCount = schemaFields.filter((field) => field.role === 'target').length;
  const featureCount = schemaFields.filter((field) => field.role === 'feature').length;

  const resetRegisterFlow = () => {
    setRegisterStep(1);
    setSelectedDatasetId(null);
    setSchemaFields([]);
    setNewModelName('');
    setNewModelType('XGBoost');
    setNewFramework('scikit-learn');
    setTrainSplit(80);
    setRegisterError('');
    setIsRegistering(false);
    setUploadedDatasetLabel('');
    setIsUploadingDataset(false);
  };

  const openRegisterFlow = () => {
    setIsRegisterOpen(true);
    resetRegisterFlow();
  };

  // Auto-select a model when navigated here via "Go to asset"
  useEffect(() => {
    const state = location.state as { selectedId?: string; openRegister?: boolean } | null;
    if (state?.selectedId) {
      setSelectedId(state.selectedId);
      // Scroll the selected model card into view after a tick
      setTimeout(() => {
        const el = document.getElementById(`model-card-${state.selectedId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    if (state?.openRegister) {
      openRegisterFlow();
    }
  }, [location.state]);

  const filtered = models.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.project.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selectedModel = models.find((m) => m.id === selectedId);

  const goToDataset = (datasetId: string) => {
    navigate('/datasets', { state: { expandedId: datasetId } });
  };

  const handleDatasetSelect = (dataset: DatasetOption) => {
    setSelectedDatasetId(dataset.id);
    setSchemaFields(buildInitialSchema(dataset));
    setRegisterError('');
    if (!newModelName) {
      setNewModelName(`${dataset.name.split(' ')[0]} Predictor`);
    }
  };

  const handleRegisterNext = () => {
    if (registerStep === 1) {
      if (!selectedDataset) {
        setRegisterError('Select a dataset before continuing.');
        return;
      }
      setRegisterError('');
      setRegisterStep(2);
      return;
    }

    if (registerStep === 2) {
      if (targetCount !== 1) {
        setRegisterError('Schema must have exactly one target column.');
        return;
      }
      if (featureCount < 1) {
        setRegisterError('Schema must include at least one feature column.');
        return;
      }
      setRegisterError('');
      setRegisterStep(3);
    }
  };

  const handleUploadTrainingData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const supported = ['.csv', '.tsv', '.json'];
    if (!supported.some((ext) => fileName.endsWith(ext))) {
      setRegisterError('Unsupported file type. Upload CSV, TSV, or JSON training data.');
      return;
    }

    try {
      setIsUploadingDataset(true);
      setRegisterError('');

      const text = await file.text();
      const parsed = parseUploadedDataset(file.name, text);
      const datasetId = `ds-upload-${Date.now()}`;
      const datasetName = file.name.replace(/\.[^.]+$/, '') || 'Uploaded Training Dataset';
      const uploadedDataset: DatasetOption = {
        id: datasetId,
        name: datasetName,
        project: 'Uploaded Training Data',
        projectColor: '#0ea5e9',
        rows: parsed.rows,
        columns: parsed.columns,
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(2)),
        schema: parsed.schema,
      };

      setDatasetOptions((prev) => [uploadedDataset, ...prev]);
      handleDatasetSelect(uploadedDataset);
      setUploadedDatasetLabel(`${uploadedDataset.name} (${uploadedDataset.rows.toLocaleString()} rows)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not parse the uploaded training data.';
      setRegisterError(message);
    } finally {
      setIsUploadingDataset(false);
    }
  };

  const handleRegisterSubmit = () => {
    if (!selectedDataset) {
      setRegisterError('Dataset selection is missing.');
      return;
    }

    if (!newModelName.trim()) {
      setRegisterError('Model name is required.');
      return;
    }

    if (targetCount !== 1 || featureCount < 1) {
      setRegisterError('Review schema: one target and at least one feature are required.');
      return;
    }

    setRegisterError('');
    setIsRegistering(true);

    const targetField = schemaFields.find((field) => field.role === 'target');
    const modelId = `mdl-${Date.now()}`;
    const trainSamples = Math.max(1, Math.round(selectedDataset.rows * (trainSplit / 100)));
    const testSamples = Math.max(1, selectedDataset.rows - trainSamples);

    const createdModel: Model = {
      id: modelId,
      name: newModelName.trim(),
      datasetId: selectedDataset.id,
      dataset: selectedDataset.name,
      version: 'v1.0',
      type: newModelType,
      framework: newFramework,
      project: selectedDataset.project,
      projectColor: selectedDataset.projectColor,
      status: 'training',
      r2: 0,
      rmse: 0,
      trainSamples,
      testSamples,
      features: featureCount,
      inferenceMs: 0,
      fileSize: '—',
      lastRetrained: 'Just now',
      description: `New model registration from dataset ${selectedDataset.name}. Target: ${targetField?.name ?? 'target'}. Training split ${trainSplit}/${100 - trainSplit}.`,
      experiment: `${newModelName.trim().replace(/\s+/g, '-')}-v1`,
      versions: [],
      tags: ['new', 'training', targetField?.name ?? 'target'],
    };

    setTimeout(() => {
      setModels((prev) => [createdModel, ...prev]);
      setSelectedId(modelId);
      setIsRegisterOpen(false);
      resetRegisterFlow();
    }, 850);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Noble AI VIP</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Models</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Model Registry</h1>
            <p className="text-sm text-gray-500 mt-0.5">Versioned model store — deploy, monitor, and manage production models</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openRegisterFlow}
              className="flex items-center gap-2 px-4 py-2 bg-[#3F98FF] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Register Model
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {[
            { label: 'Total Models', value: models.length, color: '#3F98FF' },
            { label: 'Deployed', value: models.filter((m) => m.status === 'deployed').length, color: '#059669' },
            { label: 'Staging', value: models.filter((m) => m.status === 'staging').length, color: '#3F98FF' },
            { label: 'Archived', value: models.filter((m) => m.status === 'archived').length, color: '#9ca3af' },
            { label: 'Training', value: models.filter((m) => m.status === 'training').length, color: '#d97706' },
            {
              label: 'Avg. R² (deployed)',
              value: (() => {
                const deployed = models.filter((m) => m.status === 'deployed');
                if (!deployed.length) return '0.000';
                return (deployed.reduce((sum, model) => sum + model.r2, 0) / deployed.length).toFixed(3);
              })(),
              color: '#059669',
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col">
              <div className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: model list */}
        <div className={`${selectedId ? 'w-[55%]' : 'flex-1'} overflow-auto p-6 transition-all duration-300`}>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF] bg-white w-52"
              />
            </div>
            <div className="flex items-center gap-1">
              {['all', 'deployed', 'staging', 'training', 'archived'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setViewMode('grid')} className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${viewMode === 'grid' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${viewMode === 'list' ? 'border-[#3F98FF] bg-[#3F98FF]/10 text-[#3F98FF]' : 'border-gray-200 text-gray-400'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((model) => {
                const cfg = STATUS_CONFIG[model.status];
                const isSelected = selectedId === model.id;
                return (
                  <div
                    key={model.id}
                    id={`model-card-${model.id}`}
                    onClick={() => setSelectedId(isSelected ? null : model.id)}
                    className={`bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#3F98FF] shadow-md shadow-[#3F98FF]/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3F98FF]/10 to-[#7c3aed]/10 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-4.5 h-4.5 text-[#3F98FF]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 leading-tight">{model.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{model.version}</div>
                          </div>
                        </div>
                        <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status + Type */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: model.projectColor + '15', color: model.projectColor }}>
                          {model.type}
                        </span>
                        <span className="text-[10px] text-gray-400 px-2 py-1 rounded-full bg-gray-50" style={{ color: FRAMEWORK_COLORS[model.framework] || '#9ca3af' }}>
                          {model.framework}
                        </span>
                      </div>

                      {/* Project */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.projectColor }} />
                        <span className="text-[11px] text-gray-500 truncate">{model.project}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mb-3 truncate">
                        Dataset:{' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToDataset(model.datasetId);
                          }}
                          className="text-[#3F98FF] font-medium hover:underline"
                        >
                          {model.dataset}
                        </button>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {model.status !== 'training' ? (
                          <>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold" style={{ color: model.r2 >= 0.90 ? '#059669' : model.r2 >= 0.80 ? '#3F98FF' : '#9ca3af' }}>{model.r2.toFixed(3)}</div>
                              <div className="text-[9px] text-gray-400">R²</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-700">{model.rmse.toFixed(2)}</div>
                              <div className="text-[9px] text-gray-400">RMSE</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-700">{model.inferenceMs || '—'}<span className="text-[9px] font-normal text-gray-400">ms</span></div>
                              <div className="text-[9px] text-gray-400">Inference</div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-3 bg-amber-50 rounded-lg p-2 text-center flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                            <span className="text-xs font-medium text-amber-700">Training in progress…</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {model.lastRetrained}
                        </div>
                        <div className="flex items-center gap-1">
                          {model.status === 'deployed' && (
                            <span className="flex items-center gap-0.5 text-[9px] text-green-600 font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Live API
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1.8fr_1.2fr_0.8fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <div>Model</div>
                <div>Project</div>
                <div>Status</div>
                <div>Type</div>
                <div>R²</div>
                <div>RMSE</div>
                <div>Inference</div>
                <div>Updated</div>
              </div>
              {filtered.map((model) => {
                const cfg = STATUS_CONFIG[model.status];
                return (
                  <div
                    key={model.id}
                    className={`grid grid-cols-[1.8fr_1.2fr_0.8fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-3 px-5 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors items-center ${selectedId === model.id ? 'bg-blue-50/40' : ''}`}
                    onClick={() => setSelectedId(selectedId === model.id ? null : model.id)}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{model.name} <span className="font-mono text-[10px] text-gray-400">{model.version}</span></div>
                      <div className="text-[10px] text-gray-400">
                        {model.framework} ·{' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToDataset(model.datasetId);
                          }}
                          className="text-[#3F98FF] hover:underline"
                        >
                          {model.dataset}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.projectColor }} />
                      <span className="text-xs text-gray-600 truncate">{model.project.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full w-fit" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{model.type.split(' ')[0]}</div>
                    <div className="text-sm font-bold" style={{ color: model.r2 >= 0.90 ? '#059669' : model.r2 >= 0.80 ? '#3F98FF' : '#9ca3af' }}>
                      {model.status === 'training' ? '—' : model.r2.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-600">{model.status === 'training' ? '—' : model.rmse.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">{model.inferenceMs ? `${model.inferenceMs} ms` : '—'}</div>
                    <div className="text-xs text-gray-400">{model.lastRetrained}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Model detail panel */}
        {selectedModel && (
          <div className="w-[45%] border-l border-gray-200 bg-white overflow-auto flex flex-col shrink-0">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ backgroundColor: STATUS_CONFIG[selectedModel.status].bg, color: STATUS_CONFIG[selectedModel.status].color }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedModel.status].dot}`} />
                      {STATUS_CONFIG[selectedModel.status].label}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{selectedModel.name}</h2>
                  <div className="text-xs text-gray-500 font-mono">{selectedModel.version} · {selectedModel.type}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors text-lg leading-none">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedModel.description}</p>
                <div className="mt-2 text-[11px] text-gray-500">
                  Training dataset:{' '}
                  <button
                    onClick={() => goToDataset(selectedModel.datasetId)}
                    className="font-medium text-[#3F98FF] hover:underline"
                  >
                    {selectedModel.dataset}
                  </button>
                </div>
              </div>

              {/* Performance metrics */}
              {selectedModel.status !== 'training' && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'R² Score', value: selectedModel.r2.toFixed(3), color: selectedModel.r2 >= 0.90 ? '#059669' : '#3F98FF' },
                      { label: 'RMSE', value: selectedModel.rmse.toFixed(3), color: '#7c3aed' },
                      { label: 'Train Samples', value: selectedModel.trainSamples.toLocaleString(), color: '#3F98FF' },
                      { label: 'Test Samples', value: selectedModel.testSamples.toLocaleString(), color: '#3F98FF' },
                      { label: 'Features', value: selectedModel.features, color: '#059669' },
                      { label: 'Inference', value: selectedModel.inferenceMs ? `${selectedModel.inferenceMs} ms` : '—', color: '#ea580c' },
                    ].map((m) => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Endpoint (if deployed) */}
              {selectedModel.endpoint && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">API Endpoint</h4>
                  <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <code className="text-[10px] text-green-300 break-all">{selectedModel.endpoint}</code>
                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0 ml-auto cursor-pointer hover:text-gray-200" />
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    Deployed: {selectedModel.deployedAt} · REST API · JSON I/O · Auth: Bearer token
                  </div>
                </div>
              )}

              {/* Regulatory */}
              {selectedModel.regulatory && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-green-800 leading-relaxed">{selectedModel.regulatory}</div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModel.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{t}</span>
                  ))}
                </div>
              </div>

              {/* Version history */}
              {selectedModel.versions.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" />
                    Version History
                  </h4>
                  <div className="space-y-2">
                    {selectedModel.versions.map((v, i) => (
                      <div key={v.version} className={`flex items-center gap-3 p-2.5 rounded-lg border ${i === 0 ? 'border-[#3F98FF]/30 bg-blue-50/40' : 'border-gray-100 bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${i === 0 ? 'bg-[#3F98FF] text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {i === 0 ? '★' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 font-mono">{v.version}</span>
                            <span className="text-[10px] text-gray-400">{v.date}</span>
                            <span className="text-xs font-bold ml-auto" style={{ color: v.r2 >= 0.90 ? '#059669' : '#3F98FF' }}>R² {v.r2.toFixed(3)}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{v.notes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-2">
              {selectedModel.status === 'staging' && (
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#059669] text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  <Zap className="w-3 h-3" />
                  Deploy to Production
                </button>
              )}
              {selectedModel.status === 'deployed' && (
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#3F98FF] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors">
                  <Activity className="w-3 h-3" />
                  Monitor Live
                </button>
              )}
              <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-3 h-3" />
                Download
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-3 h-3" />
                Re-train
              </button>
              {selectedModel.status !== 'archived' && (
                <button className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-xs text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-auto">
                  <Archive className="w-3 h-3" />
                  Archive
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={() => !isRegistering && setIsRegisterOpen(false)}>
          <div className="w-full max-w-[900px] max-h-[90vh] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Register New Model</div>
                <div className="text-xs text-gray-500">Dataset -&gt; Schema -&gt; Training configuration</div>
              </div>
              <button
                onClick={() => !isRegistering && setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
                disabled={isRegistering}
              >
                ×
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/70">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 1, label: 'Select Dataset' },
                  { id: 2, label: 'Adjust Schema' },
                  { id: 3, label: 'Training Details' },
                ].map((step) => {
                  const done = step.id < registerStep;
                  const active = step.id === registerStep;
                  return (
                    <div key={step.id} className={`rounded-lg border px-3 py-2 ${active ? 'border-[#3F98FF]/40 bg-[#3F98FF]/10' : done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center ${active ? 'bg-[#3F98FF] text-white' : done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {done ? '✓' : step.id}
                        </div>
                        <div className="text-xs font-semibold text-gray-700">{step.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {registerStep === 1 && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">Choose how to provide training data: upload a dataset OR select a dataset.</div>
                  <div className="rounded-xl border border-dashed border-[#3F98FF]/40 bg-[#3F98FF]/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">Upload Dataset</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Add your own dataset as CSV, TSV, or JSON and use it immediately for model training.</div>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#3F98FF] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2563eb] transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingDataset ? 'Uploading...' : 'Upload File'}
                        <input
                          type="file"
                          accept=".csv,.tsv,.json"
                          onChange={handleUploadTrainingData}
                          disabled={isUploadingDataset}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadedDatasetLabel && (
                      <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                        Uploaded: {uploadedDatasetLabel}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">OR</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="mb-2 text-sm font-semibold text-gray-800">Select a Dataset</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {datasetOptions.map((dataset) => {
                      const selected = selectedDatasetId === dataset.id;
                      return (
                        <button
                          key={dataset.id}
                          onClick={() => handleDatasetSelect(dataset)}
                          className={`text-left rounded-xl border p-3 transition-colors ${selected ? 'border-[#3F98FF] bg-[#3F98FF]/10' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-800">{dataset.name}</div>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dataset.projectColor }} />
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">{dataset.project}</div>
                          <div className="mt-2 text-[11px] text-gray-500">{dataset.rows.toLocaleString()} rows · {dataset.columns} columns · {dataset.sizeMB} MB</div>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}

              {registerStep === 2 && selectedDataset && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">Adjust roles and data types before training. You need exactly one target column.</div>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-500">Column</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-500">Type</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-500">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemaFields.map((field, index) => (
                          <tr key={field.name} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 px-3 font-mono text-gray-700">{field.name}</td>
                            <td className="py-2 px-3">
                              <select
                                value={field.type}
                                onChange={(e) => {
                                  const nextType = e.target.value as RegisterSchemaField['type'];
                                  setSchemaFields((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, type: nextType } : row)));
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                              >
                                <option value="float">float</option>
                                <option value="integer">integer</option>
                                <option value="string">string</option>
                                <option value="categorical">categorical</option>
                                <option value="boolean">boolean</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={field.role}
                                onChange={(e) => {
                                  const nextRole = e.target.value as RegisterSchemaField['role'];
                                  setSchemaFields((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, role: nextRole } : row)));
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                              >
                                <option value="feature">feature</option>
                                <option value="target">target</option>
                                <option value="ignore">ignore</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-gray-500">Features: {featureCount} · Targets: {targetCount}</div>
                </div>
              )}

              {registerStep === 3 && selectedDataset && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">Model Name</span>
                      <input
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g. SPF-Boost-v1"
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F98FF]/30 focus:border-[#3F98FF]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">Model Type</span>
                      <select
                        value={newModelType}
                        onChange={(e) => setNewModelType(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="XGBoost">XGBoost</option>
                        <option value="Random Forest">Random Forest</option>
                        <option value="LightGBM">LightGBM</option>
                        <option value="Neural Network">Neural Network</option>
                        <option value="Gaussian Process">Gaussian Process</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">Framework</span>
                      <select
                        value={newFramework}
                        onChange={(e) => setNewFramework(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="scikit-learn">scikit-learn</option>
                        <option value="XGBoost">XGBoost</option>
                        <option value="LightGBM">LightGBM</option>
                        <option value="PyTorch">PyTorch</option>
                      </select>
                    </label>
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs text-gray-500">Dataset</div>
                      <div className="text-sm font-semibold text-gray-800">{selectedDataset.name}</div>
                      <div className="text-[11px] text-gray-500 mt-1">{selectedDataset.rows.toLocaleString()} rows · {featureCount} features · {targetCount} target</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Train / Test Split</span>
                      <span className="text-xs font-semibold text-gray-700">{trainSplit}% / {100 - trainSplit}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={90}
                      value={trainSplit}
                      onChange={(e) => setTrainSplit(Number(e.target.value))}
                      className="w-full accent-[#3F98FF]"
                    />
                    <div className="mt-2 text-[11px] text-gray-500">Estimated samples: {Math.round(selectedDataset.rows * (trainSplit / 100)).toLocaleString()} train / {Math.max(1, selectedDataset.rows - Math.round(selectedDataset.rows * (trainSplit / 100))).toLocaleString()} test</div>
                  </div>
                </div>
              )}

              {registerError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {registerError}
                </div>
              )}
            </div>

            <div className="h-14 px-5 border-t border-gray-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (registerStep > 1) {
                    setRegisterStep((prev) => (prev - 1) as 1 | 2 | 3);
                    setRegisterError('');
                  } else {
                    setIsRegisterOpen(false);
                  }
                }}
                className="px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isRegistering}
              >
                {registerStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <div className="flex items-center gap-2">
                {registerStep < 3 ? (
                  <button
                    onClick={handleRegisterNext}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#3F98FF] rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleRegisterSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#3F98FF] rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : 'Register Model'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}